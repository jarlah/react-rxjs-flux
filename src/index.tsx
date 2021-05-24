import * as React from 'react';
import { useEffect, useState } from 'react';
import { Observable, ReplaySubject } from 'rxjs';
import { scan, share, startWith, tap } from 'rxjs/operators';

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentType<ComponentProps>,
) => React.ComponentType<ParentProps>;

export type PropsFactory<ComponentProps, StoreProps, UpstreamProps> = (
  store: StoreProps,
  upstream: UpstreamProps,
) => ComponentProps;

export type PropsType<ComponentProps, StoreProps, UpstreamProps> =
  | PropsFactory<ComponentProps, StoreProps, UpstreamProps>
  | ComponentProps;

export type Store<ParentProps, StoreProps> = Observable<StoreProps> | StoreFactory<ParentProps, StoreProps>;

export type StoreFactory<ParentProps, StoreProps> = (props: ParentProps) => Observable<StoreProps>;

export type Reducer<T> = (state: T) => T;

/**
 * this method should work similar to connect in react-redux, albeit a bit differently.
 *
 * @param store the store
 * @param props the props
 */
export function connect<ComponentProps, StoreProps, ParentProps>(
  store: Store<ParentProps, StoreProps>,
  props: PropsType<ComponentProps, StoreProps, ParentProps>,
): Injector<ComponentProps, ParentProps> {
  return (Component: React.ComponentType<ComponentProps>) => {
    return (parentProps: ParentProps) => {
      const [state, setState] = useState<StoreProps>();

      useEffect(() => {
        const observable = typeof store !== 'function' ? store : store(parentProps);
        const storeSubscription = observable.pipe(tap(setState)).subscribe();
        return () => storeSubscription.unsubscribe();
      }, []);

      if (!state) {
        // wait for initial data before render the component
        return null;
      }

      const customProps =
        typeof props === 'function'
          ? (props as PropsFactory<ComponentProps, StoreProps, ParentProps>)(state, parentProps)
          : props;

      return <Component {...customProps} />;
    };
  };
}

/**
 * This method basically creates an observable,
 * but it does a lot of footwork to simulate how a store (in lets say redux) works.
 *
 * @param name the name of the store
 * @param reducer$ the observable reducer
 * @param initialState the initial state, can be plain object or any type
 * @param keepAlive if this store is reused across multiple mount/unmount, should this store remember its state?
 */
export function createStore<T>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState: T = null as any,
  keepAlive: boolean = false,
): Observable<T> {
  const store = reducer$.pipe(
    scan((state: T, reducer: Reducer<T>) => reducer(state), initialState),
    startWith(initialState),
    share({
      connector: () => new ReplaySubject(1),
      resetOnError: false,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    })
  );
  if (keepAlive) {
    store.subscribe();
  }
  return store;
}

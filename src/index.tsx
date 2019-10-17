import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Observable, scheduled, SchedulerLike } from 'rxjs';
import { publishReplay, refCount, scan, startWith, tap } from 'rxjs/operators';

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

export function inject<ComponentProps, StoreProps, ParentProps>(
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

export function createStore<T>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState: T = null as any,
  keepAlive: boolean = false,
): Observable<T> {
  const store = reducer$.pipe(
    scan((state: T, reducer: Reducer<T>) => reducer(state), initialState),
    // startWith is not deprecated, this is a type error, see more at
    // https://github.com/ReactiveX/rxjs/issues/4772
    startWith(initialState),
    publishReplay(1),
    refCount(),
  );
  if (keepAlive) {
    store.subscribe();
  }
  return store;
}

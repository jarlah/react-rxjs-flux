import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Observable } from 'rxjs';
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
      const [state, setState] = useState<{ store: StoreProps }>();

      const updateState = useCallback((storeProps: StoreProps) => {
        setState({ store: storeProps });
      }, []);

      useEffect(() => {
        const observable = typeof store !== 'function' ? store : store(parentProps);
        const storeSubscription = observable.pipe(tap(updateState)).subscribe();
        return () => storeSubscription.unsubscribe();
      }, []);

      if (!state) {
        return null;
      }

      const customProps =
        typeof props === 'function'
          ? (props as PropsFactory<ComponentProps, StoreProps, ParentProps>)(state.store, parentProps)
          : props;

      return React.createElement(Component, customProps, null);
    };
  };
}

export function createStore<T extends any>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState?: T,
  keepAlive: boolean = false,
): Observable<T> {
  initialState = typeof initialState !== 'undefined' ? initialState : ({} as T);
  const store = reducer$.pipe(
    scan((state: T, reducer: Reducer<T>) => reducer(state), initialState),
    startWith(initialState),
    publishReplay(1),
    refCount(),
  );
  if (keepAlive) {
    store.subscribe();
  }
  return store;
}

import * as React from "react"
import { Observable, Subscription } from "rxjs"
import { publishReplay, refCount, scan, startWith, tap } from "rxjs/operators"

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentType<ComponentProps>
) => React.ComponentType<ParentProps>

export type PropsFactory<ComponentProps, StoreProps, UpstreamProps> = (
  store: StoreProps,
  upstream: UpstreamProps
) => ComponentProps

export type PropsType<ComponentProps, StoreProps, UpstreamProps> =
  | PropsFactory<ComponentProps, StoreProps, UpstreamProps>
  | ComponentProps

export type Store<ParentProps, StoreProps> =
  | Observable<StoreProps>
  | StoreFactory<ParentProps, StoreProps>

export type StoreFactory<ParentProps, StoreProps> = (props: ParentProps) => Observable<StoreProps>

export type Reducer<T> = (state: T) => T

export function inject<ComponentProps, StoreProps, ParentProps>(
  store: Store<ParentProps, StoreProps>,
  props: PropsType<ComponentProps, StoreProps, ParentProps>
): Injector<ComponentProps, ParentProps> {
  return (Component: React.ComponentType<ComponentProps>) => {
    class Inject extends React.Component<ParentProps, { store: StoreProps }> {
      storeSubscription?: Subscription
      devToolsSubscription?: () => void

      updateState = (store: StoreProps) => {
        this.setState({ store })
      }

      componentDidMount() {
        const observable = typeof store !== "function" ? store : store(this.props)
        this.storeSubscription = observable.pipe(tap(this.updateState)).subscribe()
      }

      componentWillUnmount() {
        // @ts-ignore if this is null, then we haven't passed componentDidMount and we are not here
        this.storeSubscription.unsubscribe()
      }

      render() {
        if (!this.state) {
          return null
        }
        const customProps =
          typeof props === "function"
            ? (props as PropsFactory<ComponentProps, StoreProps, ParentProps>)(
                this.state.store,
                this.props
              )
            : props
        return React.createElement(Component, customProps, null)
      }
    }
    return Inject
  }
}

export function createStore<T extends Object>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState?: T,
  keepAlive: boolean = false
): Observable<T> {
  initialState = typeof initialState !== "undefined" ? initialState : ({} as T)
  const store = reducer$.pipe(
    scan((state: T, reducer: Reducer<T>) => reducer(state), initialState),
    startWith(initialState),
    publishReplay(1),
    refCount()
  )
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

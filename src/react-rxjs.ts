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

type CT<P> = React.ComponentType<P>

function render<P>(C: CT<P>, p: P): React.ReactElement<P> {
  return React.createElement(C, p, null)
}

function getName<P>(C: CT<P>): string {
  return C.displayName || C.name || "Unknown"
}

export function inject<ComponentProps, StoreProps, ParentProps>(
  store: Store<ParentProps, StoreProps>,
  props: PropsType<ComponentProps, StoreProps, ParentProps>,
  _devTools?: DevToolsExtension | null
): Injector<ComponentProps, ParentProps> {
  const devTools: DevToolsExtension | null =
    typeof _devTools !== "undefined" ? _devTools : getExtension()
  return (Component: React.ComponentType<ComponentProps>) => {
    class Inject extends React.Component<ParentProps, { store: StoreProps }> {
      storeSubscription?: Subscription
      devToolsSubscription?: () => void
      devToolsInstance?: DevToolsInstance

      componentWillMount() {
        if (devTools) {
          this.devToolsInstance = devTools.connect({
            name: `${getName(Component)}Container`
          })
          this.devToolsSubscription = this.devToolsInstance.subscribe(message => {
            if (isRelevant(message)) {
              const props: StoreProps = JSON.parse(message.state)
              this.setState({ store: props })
            }
          })
        }
      }

      sendToDevTools(store: StoreProps) {
        this.devToolsInstance && this.devToolsInstance.send("update", store)
      }

      updateState(store: StoreProps) {
        this.setState({ store })
      }

      componentDidMount() {
        const observable = getObservable(store, this.props)
        this.storeSubscription = observable
          .pipe(
            tap(this.sendToDevTools.bind(this)),
            tap(this.updateState.bind(this))
          )
          .subscribe()
      }

      componentWillUnmount() {
        if (!this.storeSubscription || !this.devToolsSubscription) {
          return
        }
        this.storeSubscription.unsubscribe()
        if (devTools) {
          this.devToolsSubscription()
          devTools.disconnect()
        }
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
        return render(Component, customProps)
      }
    }
    return Inject
  }
}

function getObservable<P, T>(store: Store<P, T>, parentPops: P): Observable<T> {
  return typeof store !== "function" ? store : store(parentPops)
}

const isDev = () => process.env.NODE_ENV === "development"

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
    tap((state: T) => isDev() && console.log(name, state)),
    publishReplay(1),
    refCount()
  )
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

type Message = {
  type: string
  payload: {
    type: string
  }
  state: any
}

type DevToolsInstance = {
  subscribe: (sub: (message: Message) => void) => () => void
  send: (n: string, o: any) => void
}

type DevToolsExtension = {
  connect: (config?: { name?: string }) => DevToolsInstance
  disconnect: () => void
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: DevToolsExtension
    devToolsExtension?: DevToolsExtension
  }
}

function isRelevant(message: Message): boolean {
  if (message.type === "DISPATCH") {
    switch (message.payload.type) {
      case "JUMP_TO_ACTION":
      case "JUMP_TO_STATE":
        return true
      default:
        return false
    }
  }
  return false
}

function getExtension(): DevToolsExtension | null {
  let ext
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    ext = window.__REDUX_DEVTOOLS_EXTENSION__ || window.devToolsExtension
  }
  return ext
}

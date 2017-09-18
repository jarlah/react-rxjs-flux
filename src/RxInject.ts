import * as React from "react"
import { Observable, Subscription } from "rxjs"
import { render } from "./JsxHelper"

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentType<ComponentProps>
) => React.ComponentType<ParentProps>

export type PropsType<ComponentProps, StoreProps, UpstreamProps> = (
  store: StoreProps,
  upstream: UpstreamProps
) => ComponentProps

export type Store<ParentProps, StoreProps> =
  | Observable<StoreProps>
  | StoreFactory<ParentProps, StoreProps>

export type StoreFactory<ParentProps, StoreProps> = (
  props: ParentProps
) => Observable<StoreProps>

export default function inject<ComponentProps, StoreProps, ParentProps>(
  store: Store<ParentProps, StoreProps>,
  props: PropsType<ComponentProps, StoreProps, ParentProps>
): Injector<ComponentProps, ParentProps> {
  return (Component: React.ComponentType<ComponentProps>) => {
    type State = { store: StoreProps }
    class Inject extends React.Component<ParentProps, State> {
      state: State
      storeSubscription: Subscription
      devToolsSubscription: () => void
      devTools: DevToolsInstance

      componentWillMount() {
        const devToolsExt = getDevToolsExt()
        if (devToolsExt) {
          this.devTools = devToolsExt.connect()
          this.devToolsSubscription = this.devTools.subscribe(message => {
            if (isRelevant(message)) {
              const props: StoreProps = JSON.parse(message.state)
              this.setState({ store: props })
            }
          })
        }
      }

      sendToDevTools(store: StoreProps) {
        this.devTools && this.devTools.send("update", store)
      }

      updateState(store: StoreProps) {
        this.setState({ store })
      }

      componentDidMount() {
        this.storeSubscription = getObservable(store, this.props)
          .do(this.sendToDevTools.bind(this))
          .do(this.updateState.bind(this))
          .subscribe()
      }

      componentWillUnmount() {
        this.storeSubscription.unsubscribe()
        const devToolsExt = getDevToolsExt()
        if (devToolsExt) {
          this.devToolsSubscription()
          devToolsExt.disconnect()
        }
      }

      render() {
        if (!this.state) {
          return null
        }
        const customProps =
          typeof props === "function"
            ? props(this.state.store, this.props)
            : props
        return render(Component, customProps)
      }
    }
    return Inject
  }
}

function getDevToolsExt(): DevTools | null {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const ext = window.__REDUX_DEVTOOLS_EXTENSION__ && window.devToolsExtension
    if (ext) {
      return ext
    }
  }
  return null
}

function getObservable<P, T>(store: Store<P, T>, parentPops: P): Observable<T> {
  return store instanceof Observable
    ? store as Observable<T>
    : typeof store === "function" ? store(parentPops) : store as Observable<T>
}

export type Message = {
  type: string
  payload: {
    type: string
  }
  state: any
}

export type DevToolsInstance = {
  subscribe: (sub: (message: Message) => void) => () => void
  send: (n: string, o: any) => void
}

export type DevTools = {
  connect: () => DevToolsInstance
  disconnect: () => void
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: DevTools
    devToolsExtension?: DevTools
  }
}

export function isRelevant(message: Message): boolean {
  return (
    message.type === "DISPATCH" &&
    (message.payload.type === "JUMP_TO_ACTION" ||
      message.payload.type === "JUMP_TO_STATE")
  )
}

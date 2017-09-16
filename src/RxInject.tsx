import * as React from "react"
import { Observable, Subscription } from "rxjs"

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: DevTools | undefined
    devToolsExtension?: DevTools | undefined
  }
}

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentClass<ComponentProps>
) => React.ComponentClass<ParentProps>

export type PropsType<ComponentProps, StoreProps, UpstreamProps> = (
  store: StoreProps,
  upstream: UpstreamProps
) => ComponentProps

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

export type Store<T> = Observable<T> | StoreFactory<T>
export type StoreFactory<T> = () => Observable<T>

export default function inject<ComponentProps, StoreProps, ParentProps>(
  store: Store<StoreProps>,
  props: PropsType<ComponentProps, StoreProps, ParentProps>
): Injector<ComponentProps, ParentProps> {
  return (Component: React.ComponentClass<ComponentProps>) => {
    type State = { store: StoreProps }
    class Inject extends React.Component<ParentProps, State> {
      state: State
      subscription: Subscription
      unsubscribe: () => void
      devTools: DevToolsInstance

      componentWillMount() {
        const devToolsExt = getDevToolsExt()
        if (devToolsExt) {
          this.devTools = devToolsExt.connect()
          this.unsubscribe = this.devTools.subscribe(message => {
            if (
              message.type === "DISPATCH" &&
              (message.payload.type === "JUMP_TO_ACTION" ||
                message.payload.type === "JUMP_TO_STATE")
            ) {
              const props: StoreProps = JSON.parse(message.state)
              this.setState({ store: props })
            }
          })
        }
      }

      componentDidMount() {
        const observable = getObservable(store)
        this.subscription = observable.subscribe(storeProps => {
          if (this.devTools) {
            this.devTools.send("update", storeProps)
          }
          this.setState({ store: storeProps })
        })
      }

      componentWillUnmount() {
        this.subscription.unsubscribe()
        const devToolsExt = getDevToolsExt()
        if (devToolsExt) {
          this.unsubscribe()
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
        return <Component {...customProps} />
      }
    }
    return Inject
  }
}

function getDevToolsExt(): DevTools | undefined {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    return window.__REDUX_DEVTOOLS_EXTENSION__ && window.devToolsExtension
  }
}

function getObservable<T>(store: Store<T>): Observable<T> {
  let observable: Observable<T>
  if (store instanceof Observable) {
    observable = store
  } else if (typeof store === "function") {
    observable = store()
  } else {
    observable = store
  }
  return observable
}

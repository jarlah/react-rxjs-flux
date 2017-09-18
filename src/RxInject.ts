import * as React from "react"
import { Observable, Subscription } from "rxjs"

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentType<ComponentProps>
) => React.ComponentClass<ParentProps>

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
    return React.createClass({
      displayName: "Inject",
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
      },
      componentDidMount() {
        const observable = getObservable(store, this.props)
        this.storeSubscription = observable.subscribe(storeProps => {
          if (this.devTools) {
            this.devTools.send("update", storeProps)
          }
          this.setState({ store: storeProps })
        })
      },
      componentWillUnmount() {
        this.storeSubscription.unsubscribe()
        const devToolsExt = getDevToolsExt()
        if (devToolsExt) {
          this.devToolsSubscription()
          devToolsExt.disconnect()
        }
      },
      render() {
        if (!this.state) {
          return null
        }
        const customProps =
          typeof props === "function"
            ? props(this.state.store, this.props)
            : props
        return React.createElement(Component, customProps)
      }
    })
  }
}

function getDevToolsExt(): DevTools | undefined {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    return window.__REDUX_DEVTOOLS_EXTENSION__ && window.devToolsExtension
  }
}

function getObservable<P, T>(store: Store<P, T>, parentPops: P): Observable<T> {
  let observable: Observable<T>
  if (store instanceof Observable) {
    observable = store
  } else if (typeof store === "function") {
    observable = store(parentPops)
  } else {
    observable = store
  }
  return observable
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

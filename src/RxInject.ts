import * as React from "react"
import { render, getName } from "./JsxHelper"
import { Observable, Subscription } from "rxjs"
import { Store, PropsType, Injector, PropsFactory } from "./react-rxjs"
import { DevToolsExtension, DevToolsInstance, getExtension, isRelevant } from "./DevTools"
import { tap } from "rxjs/operators"

export default function inject<ComponentProps, StoreProps, ParentProps>(
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

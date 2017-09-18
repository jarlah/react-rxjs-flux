import * as React from "react"

export function wrap<P>(
  Component: React.StatelessComponent<P>
): React.ComponentClass<P> {
  class Wrapper extends React.Component<P, {}> {
    static displayName: string
    render() {
      return <Component {...this.props} />
    }
  }
  Wrapper.displayName =
    (Component.displayName || Component.name || "Unknown") + "Wrapper"
  return Wrapper
}

export function render<P>(
  Component: React.ComponentType<P>,
  props?: P
): React.ReactNode {
  return <Component {...props} />
}

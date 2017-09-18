import * as React from "react"

const functionWrapper = function<P>(
  Component: React.StatelessComponent<P>
): React.ComponentClass<P> {
  class Wrapper extends React.Component<P, {}> {
    static displayName: string
    render() {
      return Component(this.props)
    }
  }
  Wrapper.displayName = Component.displayName || Component.name || "Unknown"
  return Wrapper
}

export default functionWrapper

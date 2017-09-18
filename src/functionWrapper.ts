import * as React from "react"

function getDisplayName<P>(Component: React.StatelessComponent<P>): string {
  return Component.displayName || Component.name || "Unknown"
}

const functionWrapper = function<P>(
  functionalComponent: React.StatelessComponent<P>
): React.ComponentClass<P> {
  return class extends React.Component<P, {}> {
    static displayName = getDisplayName(functionalComponent)
    render() {
      return functionalComponent(this.props)
    }
  }
}

export default functionWrapper

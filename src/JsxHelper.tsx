import * as React from "react"

export function render<P>(
  Component: React.ComponentType<P>,
  p: P
): React.ReactElement<P> {
  return <Component {...p} />
}

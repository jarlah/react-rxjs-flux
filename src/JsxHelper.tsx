import * as React from "react"

export type CT<P> = React.ComponentType<P>

export function render<P>(C: CT<P>, p: P): React.ReactElement<P> {
  return <C {...p} />
}

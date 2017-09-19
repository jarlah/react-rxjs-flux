import * as React from "react"

export type CT<P> = React.ComponentType<P>

export function render<P>(C: CT<P>, p: P): React.ReactElement<P> {
  return <C {...p} />
}

export function getName<P>(C: CT<P>): string {
  return C.displayName || C.name || "Unknown"
}

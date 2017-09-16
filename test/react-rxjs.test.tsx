import inject from "../src/RxInject"
import { Observable } from "rxjs/Observable"
import * as React from "react"

describe("RxInject test", () => {
  it("RxInject is instantiable with Observable", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )
    const InjectedNumberComp = inject(
      Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp)
    expect(InjectedNumberComp).toBeInstanceOf(Function)
  })
  it("RxInject is instantiable with Factory", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )
    const InjectedNumberComp = inject(
      () => Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp)
    expect(InjectedNumberComp).toBeInstanceOf(Function)
  })
})

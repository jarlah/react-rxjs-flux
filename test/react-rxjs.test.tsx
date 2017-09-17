import { inject, createStore } from "../src/react-rxjs"
import { Observable } from "rxjs/Observable"
import * as React from "react"
import { mount } from "enzyme"
import shallowToJson from "enzyme-to-json"

describe("RxInject", () => {
  it("is instantiable with Observable", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )
    const InjectedNumberComp = inject(
      Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp)
    expect(InjectedNumberComp).toBeInstanceOf(Function)
    const wrapper = mount(<InjectedNumberComp />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
  })
  it("is instantiable with Factory", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )
    const InjectedNumberComp = inject(
      () => Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp)
    const t: { n: string } = 1
    expect(t).toBe(1)
    expect(InjectedNumberComp).toBeInstanceOf(Function)
    const wrapper = mount(<InjectedNumberComp />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
  })
})

describe("RxStore", () => {
  it("has initial state", done => {
    const store$ = createStore("test", Observable.empty(), 42)
    store$.subscribe((n: number) => {
      expect(n).toBe(42)
      done()
    })
  })
  it("gets state updates from reducer", done => {
    process.env.NODE_ENV = "development"
    let next = 0
    const store$ = createStore(
      "test",
      Observable.of((state: number) => state + 1),
      next
    )
    store$.subscribe((n: number) => {
      expect(n).toBe(next)
      if (next > 0) {
        done()
      }
      next++
    })
  })
  afterEach(() => {
    console.log("cleaning up")
    delete process.env.NODE_ENV
  })
})

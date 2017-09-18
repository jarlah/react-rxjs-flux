import { inject, createStore } from "../src/react-rxjs"
import { isRelevant } from "../src/RxInject"
import { Observable } from "rxjs/Observable"
import * as React from "react"
import { mount } from "enzyme"
import shallowToJson from "enzyme-to-json"
import wrap from "../src/Wrapper"

describe("Wrapper", () => {
  it("should wrap around component", () => {
    const hello = () => <span>hello</span>
    const WrappedHello = wrap(hello)
    const wrapper = mount(<WrappedHello />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
  })
})

describe("isRelevant", () => {
  it("should be relevant", () => {
    expect(
      isRelevant({
        type: "DISPATCH",
        state: 42,
        payload: { type: "JUMP_TO_STATE" }
      })
    ).toBe(true)
  })
  it("should not be relevant", () => {
    expect(
      isRelevant({
        type: "JADAJADA"
      })
    ).toBe(false)
  })
})

describe("RxInject", () => {
  it("is instantiable with Observable", done => {
    process.env.NODE_ENV = "development"
    window.__REDUX_DEVTOOLS_EXTENSION__ = true
    let next = 0
    let wrapper
    window.devToolsExtension = {
      connect: () => ({
        subscribe: (
          fn: (
            msg: { type: string; state: any; payload: { type: string } }
          ) => void
        ) => {
          setTimeout(() => {
            fn({
              type: "DISPATCH",
              state: 42,
              payload: { type: "JUMP_TO_STATE" }
            })
            wrapper.update()
            expect(shallowToJson(wrapper)).toMatchSnapshot()
            done()
          }, 500)
          return () => null
        },
        send: (name: string, state: number) => {
          expect(state).toEqual(next)
          next++
        }
      }),
      disconnect: () => null
    }

    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )

    const stream = Observable.of(0, 1, 2)

    const InjectedNumberComp = inject(stream, (storeProps: number) => ({
      number: storeProps
    }))(NumberComp)

    expect(InjectedNumberComp).toBeInstanceOf(Function)

    wrapper = mount(<InjectedNumberComp />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
    setTimeout(() => {
      wrapper.unmount()
    }, 1000)
  })

  it("is instantiable with Factory", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )

    const InjectedNumberComp = inject(
      () => Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp)

    expect(InjectedNumberComp).toBeInstanceOf(Function)

    const wrapper = mount(<InjectedNumberComp />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
    wrapper.unmount()
  })

  it("is instantiable with Factory and class component", () => {
    class NumberComp2 extends React.Component<{ number: number }, {}> {
      render() {
        return <span>{this.props.number}</span>
      }
    }

    const InjectedNumberComp = inject(
      () => Observable.of(0),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp2)

    expect(InjectedNumberComp).toBeInstanceOf(Function)

    const wrapper = mount(<InjectedNumberComp />)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
    wrapper.unmount()
  })

  it("should fail horribly if passed wrong values", done => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    )

    const InjectedNumberComp = inject("", (storeProps: number) => ({
      number: storeProps
    }))(NumberComp)

    expect(InjectedNumberComp).toBeInstanceOf(Function)

    try {
      const wrapper = mount(<InjectedNumberComp />)
      expect(shallowToJson(wrapper)).toMatchSnapshot()
      fail("Should fail!")
    } catch (e) {
      expect(e.message).toEqual("observable.subscribe is not a function")
      done()
    }
  })
  afterEach(() => {
    delete process.env.NODE_ENV
    delete window.__REDUX_DEVTOOLS_EXTENSION__
    delete window.devToolsExtension
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
    delete process.env.NODE_ENV
  })
})

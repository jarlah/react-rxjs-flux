import { inject, createStore } from "../src/react-rxjs"
import { isDev } from "../src/RxStore"
import { isRelevant, getExtension } from "../src/DevTools"
import { Observable, Subject } from "rxjs"
import * as React from "react"
import { mount } from "enzyme"
import shallowToJson from "enzyme-to-json"
import { wrap, render } from "../src/JsxHelper"

describe("getExtension", () => {
  it("should return null if no extension in  dev mode", () => {
    process.env.NODE_ENV = "development"
    expect(getExtension()).toBe(null)
  })
  afterEach(() => {
    delete process.env.NODE_ENV
  })
})

describe("isDev", () => {
  it("should be dev if NODE_ENV is development", () => {
    process.env.NODE_ENV = "development"
    expect(isDev()).toBe(true)
  })
  it("should NOT be dev if NODE_ENV is production", () => {
    process.env.NODE_ENV = "production"
    expect(isDev()).toBe(false)
  })
  afterEach(() => {
    delete process.env.NODE_ENV
  })
})

describe("render", () => {
  it("should render component", () => {
    const hello = (p: { n: number }) => <span>{p.n}</span>
    const RenderedHello = render(hello, { n: 1 })
    const wrapper = mount(RenderedHello)
    expect(shallowToJson(wrapper)).toMatchSnapshot()
  })
})

describe("isRelevant", () => {
  it("should be relevant jump to state", () => {
    expect(
      isRelevant({
        type: "DISPATCH",
        state: 42,
        payload: { type: "JUMP_TO_STATE" }
      })
    ).toBe(true)
  })
  it("should be relevant jump to action", () => {
    expect(
      isRelevant({
        type: "DISPATCH",
        state: 42,
        payload: { type: "JUMP_TO_ACTION" }
      })
    ).toBe(true)
  })
  it("should not be relevant if wrong payload type", () => {
    expect(
      isRelevant({
        type: "DISPATCH",
        state: 42,
        payload: { type: "SHIT" }
      })
    ).toBe(false)
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
            fn({
              type: "JADAJADA"
            })
            wrapper.update()
            expect(shallowToJson(wrapper)).toMatchSnapshot()
          }, 0)
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
      done()
    }, 500)
  })

  it("is instantiable with Factory 1", () => {
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
    delete process.env.NODE_ENV
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
    wrapper.mount()
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
      expect(e.message).toEqual("getObservable(...).do is not a function")
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

    const action = new Subject<void>()

    const store$ = createStore(
      "test",
      action.map(() => (state: number) => state + 1),
      next,
      true
    )

    store$.subscribe((n: number) => {
      expect(n).toBe(next)
      if (n === 2) {
        done()
      } else {
        next++
      }
    })
    setTimeout(action.next.bind(action), 0)
    setTimeout(action.next.bind(action), 0)
  })

  afterEach(() => {
    delete process.env.NODE_ENV
  })
})

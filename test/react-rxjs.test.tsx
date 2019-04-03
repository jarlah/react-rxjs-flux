import { inject, createStore } from "../src/react-rxjs"
import {EMPTY, of, Subject} from "rxjs"
import * as React from "react"
import {configure, mount} from "enzyme"
import shallowToJson from "enzyme-to-json"
import {map} from "rxjs/operators";
import * as Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

beforeEach(() => {
  process.env.NODE_ENV = "development"
});

afterEach(() => {
  delete process.env.NODE_ENV
});

type OnSubscribeFn = (
  msg: { type: string; state: any; payload: { type: string } }
) => void
type OnMessageFn = (name: string, state: number) => void

function createDummyDevTools(
  onConnect: (config?: { name: string }) => void,
  onSubscribe: (fn: OnSubscribeFn) => void,
  onMessage: OnMessageFn,
  onDisconnect?: () => void
) {
  return {
    connect: (config?: { name: string }) => {
      onConnect(config);
      return {
        subscribe: (fn: OnSubscribeFn) => {
          onSubscribe(fn);
          return () => null
        },
        send: onMessage
      }
    },
    disconnect: onDisconnect ? onDisconnect : () => null
  }
}

describe("RxInject", () => {
  it("is instantiable with Observable", done => {
    let next = 0;
    let wrapper;
    let nameChecked = false;

    const onSubscribe = fn => {
      setTimeout(() => {
        fn({
          type: "DISPATCH",
          state: 42,
          payload: { type: "JUMP_TO_STATE" }
        });
        fn({
          type: "JADAJADA"
        });
        wrapper.update()
        expect(shallowToJson(wrapper)).toMatchSnapshot()
      }, 0)
    };

    const onMessage = (name, state) => {
      expect(state).toEqual(next);
      next++
    };

    const onConnect = config => {
      expect(config).not.toBeNull();
      expect(config.name).toEqual("NumberCompContainer");
      nameChecked = true
    };

    const devTools = createDummyDevTools(onConnect, onSubscribe, onMessage)

    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    );

    const stream = of(0, 1, 2);

    const InjectedNumberComp = inject(
      stream,
      (storeProps: number) => ({
        number: storeProps
      }),
      devTools as any
    )(NumberComp);

    expect(InjectedNumberComp).toBeInstanceOf(Function);

    wrapper = mount(<InjectedNumberComp />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
    setTimeout(() => {
      wrapper.unmount();
      expect(nameChecked).toBeTruthy();
      done()
    }, 500)
  })

  it("is instantiable with props object", () => {
    const NumberComp = (props: { number: 5000 }) => (
      <span>{props.number}</span>
    );

    const InjectedNumberComp = inject(of(0), { number: 5000 })(
      NumberComp as any
    );

    expect(InjectedNumberComp).toBeInstanceOf(Function);

    const wrapper = mount(<InjectedNumberComp />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
    wrapper.unmount()
  });

  it("is instantiable with props object and nulled devtools", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    );

    const InjectedNumberComp = inject(of(0), { number: 5000 }, null)(
      NumberComp
    );

    expect(InjectedNumberComp).toBeInstanceOf(Function);

    const wrapper = mount(<InjectedNumberComp />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
    wrapper.unmount()
  });

  it("is instantiable with Factory abd props function", () => {
    const NumberComp = (props: { number: number }) => (
      <span>{props.number}</span>
    );

    const InjectedNumberComp = inject(
      () => of(666),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp);

    expect(InjectedNumberComp).toBeInstanceOf(Function);

    const wrapper = mount(<InjectedNumberComp />);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
    wrapper.unmount()
  });

  it("is instantiable with Factory and class component", () => {
    class NumberComp2 extends React.Component<{ number: number }, {}> {
      render() {
        return <span>{this.props.number}</span>
      }
    }

    const InjectedNumberComp = inject(
      () => of(1337),
      (storeProps: number) => ({ number: storeProps })
    )(NumberComp2);

    expect(InjectedNumberComp).toBeInstanceOf(Function);

    const wrapper = mount(<InjectedNumberComp />);
    expect(shallowToJson(wrapper)).toMatchSnapshot()
  })
});

describe("RxStore", () => {
  it("has initial state", done => {
    const store$ = createStore("test", EMPTY, 42)

    store$.subscribe((n: number) => {
      expect(n).toBe(42);
      done()
    })
  });

  it("gets state updates from reducer", done => {
    let next = 0;

    const action = new Subject<void>();

    const store$ = createStore(
      "test",
      action.pipe(map(() => (state: number) => state + 1)),
      next,
      true
    );

    store$.subscribe((n: number) => {
      expect(n).toBe(next);
      if (n === 2) {
        done()
      } else {
        next++
      }
    });
    setTimeout(action.next.bind(action), 0);
    setTimeout(action.next.bind(action), 0)
  })
});

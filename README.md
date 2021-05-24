# react-rxjs-flux

> A small library for creating applications based on unidirectional flux like data flow with RxJS. Now with support for RxJS 6.

[![NPM](https://nodei.co/npm/react-rxjs-flux.png?compact=true)](https://npmjs.org/package/react-rxjs-flux)

## Install

```bash
yarn add react-rxjs-flux
```

## Usage

```js
// view.tsx
export type ViewProps = {
  number: number,
  inc: () => void,
  dec: () => void
};

const View = (props: ViewProps) => (
    <div>
      {props.number}
      <button onClick={props.inc}>+</button>
      <button onClick={props.dec}>-</button>
    </div>
);

export default View;
```

```js
// store.ts
import { createStore } from 'react-rxjs';
import { merge, Subject, Observable } from "rxjs";
import { map } from "rxjs/operators";

const inc$ = new Subject<void>();
const dec$ = new Subject<void>();

const reducer$: Observable<(state: number) => number> = merge(
    inc$.pipe(map(() => (state: number) => state + 1)),
    dec$.pipe(map(() => (state: number) => state - 1))
);

const store$ = createStore("example", reducer$, 0);

export const inc = () => inc$.next();
export const dec = () => dec$.next();

export default store$;
```

```js
// container.ts
import { connect } from 'react-rxjs';
import store$, { inc, dec } from './store';
import View, { ViewProps } from './view';

const mapStateToProps = (storeState: number): ViewProps => ({
    number: storeState,
    inc,
    dec
});

export default connect(store$, props)(View);
```

## License

[MIT](http://vjpr.mit-license.org)

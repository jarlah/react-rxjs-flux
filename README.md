# react-rxjs

> A small library for creating applications based on unidirectional data flow with RxJS.

[![Build Status](https://travis-ci.org/jarlah/react-rxjs.svg?branch=master)](https://travis-ci.org/jarlah/react-rxjs)
[![Coverage Status](https://coveralls.io/repos/github/jarlah/react-rxjs/badge.svg?branch=master&q=1234567)](https://coveralls.io/github/jarlah/react-rxjs?branch=master)

[![NPM](https://nodei.co/npm/react-rxjs.png?compact=true)](https://npmjs.org/package/react-rxjs)

## Install

```bash
npm i -S react-rxjs
```

## Usage

```js
// view.tsx
import * as React from 'react';

export type MyProps = { 
  number: number, 
  inc: () => void, 
  dec: () => void 
};

class MyComponent extends React.Component<MyProps, {}> {
    render() {
        return (
          <div>
            {this.props.number}
            <button onClick={this.props.inc}>+</button>
            <button onClick={this.props.dec}>-</button>
          </div>
        );
    }
}

export default MyComponent;
```

```js
// store.ts
import { createStore } from 'react-rxjs';

const inc$ = new Subject<void>();
const dec$ = new Subject<void>();

const reducer$: Observable<(state: number) => number> = Observable.merge(
    inc$.map(() => (state: number) => state + 1),
    dec$.map(() => (state: number) => state - 1)
);

const store$ = createStore("example", reducer$, 0);

export inc = () => inc$.next();
export dec = () => dec$.next();
export default store$;
```

```js
// container.ts
import { inject } from 'react-rxjs';
import store$, { inc, dec } from './store';
import MyComponent from './view';

const props = (storeState: number): MyProps => ({
    number: storeState,
    inc,
    dec
});

export default inject(store$, props)(MyComponent);
```

## License

[MIT](http://vjpr.mit-license.org)

This project is a fork and rewrite of the original code from [MUSIT Norway](https://gitlab.com/MUSIT-Norway/react-rxjs)

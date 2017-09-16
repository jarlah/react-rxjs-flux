# react-rxjs

> A small library for creating applications based on unidirectional data flow with RxJS.

## Install

```bash
npm i -S react-rxjs
```

## Usage

```js
// view.js
export type MyProps = { 
  number: number, 
  inc: () => void, 
  dec: () => void 
};

class MyComponent extends React.Component<MyProps, {}> {
    render() {
        return <span>{this.props.number} <button onClick={this.props.inc}>+</button> <button onClick={this.props.dec}>-</button></span>;
    }
}

export default MyComponent;

// store.js
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

// container.js
const props = (storeState: number): MyProps => {
    return {
        number: storeState,
        inc,
        dec
    };
};

export default inject(store$, props)(MyComponent);
```

## License

[MIT](http://vjpr.mit-license.org)

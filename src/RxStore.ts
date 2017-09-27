import { Observable } from "rxjs"

export type Reducer<T> = (state: T) => T

export const isDev = () => process.env.NODE_ENV === "development"

export default function createStore<T extends Object>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState?: T,
  keepAlive: boolean = false
): Observable<T> {
  initialState = typeof initialState !== "undefined" ? initialState : null as T
  const store = reducer$
    .scan((state, reducer) => reducer(state), initialState)
    .startWith(initialState)
    .do((state: T) => isDev() && console.log(name, state))
    .publishReplay(1)
    .refCount()
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

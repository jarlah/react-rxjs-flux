import { Observable } from "rxjs"

export type Reducer<T> = (state: T) => T

export const isDev = () => process.env.NODE_ENV === "development"

export default function createStore<T>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState: T,
  keepAlive: boolean = false
): Observable<T> {
  const store = reducer$
    .scan((state, reducer) => reducer(state), initialState)
    .do((state: T) => isDev() && console.log(name, state))
    .publishReplay(1)
    .refCount()
    .startWith(initialState)
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

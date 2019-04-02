import { Observable } from "rxjs"
import { publishReplay, refCount, scan, startWith, tap } from "rxjs/operators"
import { Reducer } from "./react-rxjs"

export type Reducer<T> = (state: T) => T

export const isDev = () => process.env.NODE_ENV === "development"

export default function createStore<T extends Object>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState?: T,
  keepAlive: boolean = false
): Observable<T> {
  initialState = typeof initialState !== "undefined" ? initialState : ({} as T)
  const store = reducer$.pipe(
    scan((state: T, reducer: Reducer<T>) => reducer(state), initialState),
    startWith(initialState),
    tap((state: T) => isDev() && console.log(name, state)),
    publishReplay(1),
    refCount()
  )
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

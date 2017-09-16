import { Observable, Subject } from "rxjs"

export function createAction<T>(name: string): Subject<T> {
  const action = new Subject<T>()
  action.subscribe((action: T) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(name, action)
    }
  })
  return action
}

export function createActions<T>(
  ...actionNames: Array<string>
): { [key: string]: Subject<T> } {
  return actionNames.reduce(
    (akk, name) => ({ ...akk, [name]: createAction(name) }),
    {}
  )
}

export type Reducer<T> = (state: T) => T

export default function createStore<T>(
  name: string,
  reducer$: Observable<Reducer<T>>,
  initialState: T,
  keepAlive: boolean = false
): Observable<T> {
  const store = reducer$
    .scan((state, reducer) => reducer(state), initialState)
    .do((state: T) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(name, state)
      }
    })
    .publishReplay(1)
    .refCount()
    .startWith(initialState)
  if (keepAlive) {
    store.subscribe()
  }
  return store
}

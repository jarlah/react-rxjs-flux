import * as React from "react"
import { Observable } from "rxjs"

export type Injector<ComponentProps, ParentProps> = (
  Component: React.ComponentType<ComponentProps>
) => React.ComponentType<ParentProps>

export type PropsFactory<ComponentProps, StoreProps, UpstreamProps> = (
  store: StoreProps,
  upstream: UpstreamProps
) => ComponentProps

export type PropsType<ComponentProps, StoreProps, UpstreamProps> =
  | PropsFactory<ComponentProps, StoreProps, UpstreamProps>
  | ComponentProps

export type Store<ParentProps, StoreProps> =
  | Observable<StoreProps>
  | StoreFactory<ParentProps, StoreProps>

export type StoreFactory<ParentProps, StoreProps> = (
  props: ParentProps
) => Observable<StoreProps>

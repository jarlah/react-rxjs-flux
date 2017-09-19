export type Message = {
  type: string
  payload: {
    type: string
  }
  state: any
}

export type DevToolsInstance = {
  subscribe: (sub: (message: Message) => void) => () => void
  send: (n: string, o: any) => void
}

export type DevToolsExtension = {
  connect: (config?: { name?: string }) => DevToolsInstance
  disconnect: () => void
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: DevToolsExtension
    devToolsExtension?: DevToolsExtension
  }
}

export function isRelevant(message: Message): boolean {
  if (message.type === "DISPATCH") {
    switch (message.payload.type) {
      case "JUMP_TO_ACTION":
      case "JUMP_TO_STATE":
        return true
      default:
        return false
    }
  }
  return false
}

export function getExtension(): DevToolsExtension | null {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const ext = window.__REDUX_DEVTOOLS_EXTENSION__ || window.devToolsExtension
    if (ext) {
      return ext
    }
  }
  return null
}

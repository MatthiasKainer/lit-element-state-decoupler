export type LitLikeElement = { requestUpdate: () => void }

export type Reducer<T> = (state: T, payload: unknown) => {[action: string]: () => T}
export type Dispatch<T> = {
    getState: () => T,
    publish: (update: T) => void,
    subscribe: (onChange: (state: T) => void) => void
}
export type Reduce<T> = {
    getState: () => T,
    publish: <T>(action: string, data: T) => void,
    subscribe: (onChange: (state: T) => void) => void
}
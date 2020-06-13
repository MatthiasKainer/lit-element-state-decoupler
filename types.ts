export type LitLikeElement = {
    requestUpdate: () => void
    dispatchEvent: (e: Event) => boolean
}

export type UpdateableLitLikeElement = {
    updated(_?: any): void
}

type Dispatchers = {
    index: number,
    count: number,
    dispatchers: Dispatch<any>[]
    reducers: Reduce<any>[]
}

export type DecoratedLitLikeElement = LitLikeElement & {
    __registered_dispatchers: Dispatchers
}

export type Reducer<T> = (state: T) => {[action: string]: (payload?: any | unknown | undefined) => T}

export type ReducerOptions = {
    dispatchEvent?: boolean
}
export type Dispatch<T> = {
    getState: () => T,
    publish: (update: T) => void,
    subscribe: (onChange: (state: T) => void) => void
}
export type Reduce<T> = {
    getState: () => T,
    publish: <T>(action: string, data: T) => void,
    subscribe: (onChange: (action: string, state: T) => void) => void
    when: (action: string, onChange: (state: T) => void) => void
}
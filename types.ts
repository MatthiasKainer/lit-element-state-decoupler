export type LitLikeElement = {
    requestUpdate: () => void
    dispatchEvent: (e: Event) => boolean
}

export type UpdateableLitLikeElement = {
    updated(_?: any): void
}

type States = {
    index: number,
    count: number,
    states: InjectableState<any>[]
    reducers: Reduce<any>[]
}

export type DecoratedLitLikeElement = LitLikeElement & {
    __registered_states: States
}

export type Reducer<T> = (state: T) => {[action: string]: (payload?: any | unknown | undefined) => T}

export type StateOptions = {
    updateDefault?: boolean
}

export type ReducerOptions = StateOptions & {
    dispatchEvent?: boolean
}
export interface State<T> {
    /**
     * @deprecated The method should not be used. Use `get` or `value` instead.
     */
    getState: () => T
    /**
     * @deprecated The method should not be used. Use `set` or `value` instead.
     */
    publish: (update: T) => void
    get: () => T
    set: (update: T) => void
    value: T
    subscribe: (onChange: (state: T) => void) => void
}
export interface InjectableState<T> extends State<T> {
    inject: (update: T) => void,
}
export type Reduce<T> = {
    /**
     * @deprecated The method should not be used. Use `get` or `value` instead.
     */
    getState: () => T
    /**
     * @deprecated The method should not be used. Use `set` or `value` instead.
     */
    publish: <T>(action: string, data?: T) => void
    get: () => T
    set: <T>(action: string, data?: T) => void
    subscribe: (onChange: (action: string, state: T) => void) => void
    when: (action: string, onChange: (state: T) => void) => void
}
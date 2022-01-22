export type LitLikeElement = {
    requestUpdate: () => void
    dispatchEvent: (e: Event) => boolean
    updateComplete: Promise<void>
}

export type UpdateableLitLikeElement = {
    updated(_?: any): void
}

type States = {
    index: number,
    count: number,
    states: InjectableState<any>[]
    reducers: Reduce<any>[]
    workflows: Workflow[]
}

export type DecoratedLitLikeElement = LitLikeElement & {
    __registered_states: States
}

export type Reducer<T> = (state: T) => {[action: string]: (payload?: any | unknown | undefined) => Promise<T>}

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
    set: (update: T) => Promise<void>
    value: T
    subscribe: (onChange: (state: T) => Promise<void>) => void
}
export interface InjectableState<T> extends State<T> {
    inject: (update: T) => void,
}

export type Reduce<T> = {
    get: () => T
    set: <T>(action: string, data?: T) => Promise<T>
    subscribe: (onChange: (action: string, state: T) => void) => void
    when: (action: string, onChange: (state: T) => void) => void
    dispatch: <T>(action: string, data?: T) => Promise<T>
}

export type WorkflowHistory = { type: string, args: unknown[] }

export type Workflow = {
    addActivity: (activity: string, data?: unknown) => Promise<void>
    addCompensation: (activity: string, data?: unknown) => void
    addSideeffect: (activity: string, sideeffect: (data?: unknown) => Promise<unknown>) => void
    projections: (key: string) => any
    after: (timeout: Date, unlessActivity: WorkflowHistory, execute: () => Promise<unknown>) => void
    compensate: () => Promise<unknown>
    history: () => WorkflowHistory[]
    plan: <T>(plan: {[entity: string]: () => Promise<T>}) => Promise<T | null>
}
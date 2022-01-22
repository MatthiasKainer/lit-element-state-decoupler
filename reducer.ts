import { LitLikeElement, Reduce, Reducer, ReducerOptions } from "./types";
import { useState } from "./state";
import { withReducer } from "./decorator";

export const useReducer = <T>(element: LitLikeElement, reducer: Reducer<T>, defaultValue: T, options: ReducerOptions = {}): Reduce<T> => {
    const {get: getState, set} = useState<T>(element, defaultValue, options)

    const subscribers: ((action: string, state: T) => void)[] = []

    const dispatch = async (action: string, payload?: T | undefined) => {
        const reducers = reducer(getState())
        if (reducers[action]) {
            await set(await reducers[action](payload))
            subscribers.forEach(subscriber => subscriber(action, getState()));
            options.dispatchEvent && 
                element.dispatchEvent(new CustomEvent(action, { detail: getState() }))
        }
        return getState()
    }

    return withReducer(element, {
        get: getState,
        subscribe: (onChange) => subscribers.push(onChange),
        when: (action, onChange) => subscribers.push((triggeredAction, state) => triggeredAction === action && onChange(state)),
        set: dispatch,
        dispatch
    } as Reduce<T>)
}
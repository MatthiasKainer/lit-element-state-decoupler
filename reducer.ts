import { LitLikeElement, Reduce, Reducer, ReducerOptions } from "./types";
import { useState } from "./state";
import { withReducer } from "./decorator";

export const useReducer = <T>(element: LitLikeElement, reducer: Reducer<T>, defaultValue: T, options: ReducerOptions = {}): Reduce<T> => {
    const {getState, publish} = useState<T>(element, defaultValue, options)

    const subscribers: ((action: string, state: T) => void)[] = []
    return withReducer(element, {
        getState,
        subscribe: (onChange) => subscribers.push(onChange),
        when: (action, onChange) => subscribers.push((triggeredAction, state) => triggeredAction === action && onChange(state)),
        publish: (action, payload) => {
            const reducers = reducer(getState())
            if (reducers[action]) {
                publish(reducers[action](payload))
                subscribers.forEach(subscriber => subscriber(action, getState()));
                options.dispatchEvent && 
                    element.dispatchEvent(new CustomEvent(action, { detail: getState() }))
            }
        }
    })
}
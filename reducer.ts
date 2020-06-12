import { LitLikeElement, Reduce, Reducer, ReducerOptions } from "./types";
import { useDispatcher } from "./dispatcher";
import { withReducer } from "./decorator";

export const useReducer = <T>(element: LitLikeElement, reducer: Reducer<T>, defaultValue: T, options: ReducerOptions = {}): Reduce<T> => {
    const {getState, publish} = useDispatcher<T>(element, defaultValue)

    const subscribers: ((action: string, state: T) => void)[] = []
    return withReducer(element, {
        getState,
        subscribe: (onChange) => subscribers.push(onChange),
        publish: (action, payload) => {
            const reducers = reducer(getState(), payload)
            if (reducers[action]) {
                publish(reducers[action]())
                subscribers.forEach(subscriber => subscriber(action, getState()));
                options.dispatchEvent && 
                    element.dispatchEvent(new CustomEvent(action, { detail: {change: payload, state: getState()} }))
            }
        }
    })
}
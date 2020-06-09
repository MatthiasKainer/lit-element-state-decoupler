import { LitLikeElement, Reduce, Reducer, ReducerOptions } from "./types";
import { useDispatcher } from "./dispatcher";
import { withReducer } from "./decorator";

export const useReducer = <T>(element: LitLikeElement, reducer: Reducer<T>, defaultValue: T, options: ReducerOptions = {}): Reduce<T> => {
    const {getState, publish, subscribe} = useDispatcher<T>(element, defaultValue)

    return withReducer(element, {
        getState,
        subscribe,
        publish: (action, payload) => {
            const reducers = reducer(getState(), payload)
            if (reducers[action]) {
                publish(reducers[action]())
                options.dispatchEvent && 
                    element.dispatchEvent(new CustomEvent(action, { detail: {change: payload, state: getState()} }))
            }
        }
    })
}
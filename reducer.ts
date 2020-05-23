import { LitLikeElement, Reduce, Reducer } from "./types";
import { useDispatcher } from "./dispatcher";

export const useReducer = <T>(element: LitLikeElement, reducer: Reducer<T>, defaultValue: T): Reduce<T> => {
    const {getState, publish, subscribe} = useDispatcher<T>(element, defaultValue)

    return {
        getState,
        subscribe,
        publish: (action, payload) => {
            const reducers = reducer(getState(), payload)
            reducers[action] && publish(reducers[action]())
        }
    }
}
import { LitLikeElement, Dispatch } from "./types";


export const useDispatcher = <T>(element: LitLikeElement, defaultValue: T): Dispatch<T> => {
    let state = {...defaultValue};
    const subscribers: ((state: T) => void)[] = [() => element.requestUpdate()]
    return {
        publish: (update: T) => {
            state = {...state, ...update}
            subscribers.forEach(subscriber => subscriber(state));
        },
        subscribe: (onChange) => subscribers.push(onChange),
        getState: () => (state)
    };
}

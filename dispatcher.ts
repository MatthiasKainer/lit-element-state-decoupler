import { LitLikeElement, Dispatch } from "./types";
import { shallowClone } from "./clone";
import { withDispatcher } from "./decorator";

export const useDispatcher = <T>(element: LitLikeElement, defaultValue: T): Dispatch<T> => {
    let state = shallowClone(defaultValue);
    const subscribers: ((state: T) => void)[] = [() => element.requestUpdate()]
    return withDispatcher(element, {
        publish: (update: T) => {
            if (state === update) return;
            state = shallowClone(update)
            subscribers.forEach(subscriber => subscriber(state));
        },
        subscribe: (onChange) => subscribers.push(onChange),
        getState: () => (state)
    });
}

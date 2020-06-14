import { LitLikeElement, State } from "./types";
import { shallowClone } from "./clone";
import { withState } from "./decorator";

export const useState = <T>(element: LitLikeElement, defaultValue: T): State<T> => {
    let state = shallowClone(defaultValue);
    const subscribers: ((state: T) => void)[] = [() => element.requestUpdate()]
    return withState(element, {
        publish: (update: T) => {
            if (state === update) return;
            state = shallowClone(update)
            subscribers.forEach(subscriber => subscriber(state));
        },
        subscribe: (onChange) => subscribers.push(onChange),
        getState: () => (state)
    });
}

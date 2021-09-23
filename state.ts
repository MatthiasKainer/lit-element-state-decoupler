import { LitLikeElement, State, InjectableState, StateOptions } from "./types";
import { shallowClone } from "./clone";
import { withState } from "./decorator";

export const useState = <T>(element: LitLikeElement, defaultValue: T, options: StateOptions = {}): State<T> => {
    let state = shallowClone(defaultValue);
    const subscribers: ((state: T) => void)[] = [() => element.requestUpdate()]
    const set = async (update: T) => {
        if (state === update) return;
        state = shallowClone(update)
        subscribers.forEach(subscriber => subscriber(state));
    }
    return withState(element, new class {
        set value(update: T) {
            set(update)
        }
        get value() { return state }
        publish(update: T) { set(update) }
        async set(update: T) { await set(update) }
        subscribe(onChange: (state: T) => void) { subscribers.push(onChange) }
        inject(update: T) {state = update}
        get() { return state }
        getState() { return state }
    } as InjectableState<T>, options) ;
}

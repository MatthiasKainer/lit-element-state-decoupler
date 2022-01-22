import { LitLikeElement, State, InjectableState, StateOptions } from "./types";
import { shallowClone } from "./clone";
import { withState } from "./decorator";

export const useState = <T>(element: LitLikeElement, defaultValue: T, options: StateOptions = {}): State<T> => {
    let state = shallowClone(defaultValue);
    const subscribers: ((state: T) => Promise<void>)[] = [async () => (element.requestUpdate(), await element.updateComplete)]
    const set = async (update: T) => {
        if (state === update) return;
        state = shallowClone(update)
        for (const subscriber of subscribers) {
            await subscriber(state)
        }
    }
    return withState(element, new class {
        set value(update: T) {
            set(update)
        }
        get value() { return state }
        publish(update: T) { set(update) }
        async set(update: T) { await set(update) }
        subscribe(onChange: (state: T) => Promise<void>) { subscribers.push(onChange) }
        inject(update: T) {state = update}
        get() { return state }
        getState() { return state }
    } as InjectableState<T>, options) ;
}

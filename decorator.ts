import { LitLikeElement, DecoratedLitLikeElement, State, Reduce, UpdateableLitLikeElement } from "./types";

export function asUpdateableLitElement(element: LitLikeElement) {
    if (!element.dispatchEvent || !element.requestUpdate) throw new Error("Element missing required functions (dispatchEvent/requestUpdate)")
    return element as unknown as UpdateableLitLikeElement
}

export function decorate(litElement: LitLikeElement) {
    const decoratedLitElement = (litElement as DecoratedLitLikeElement)
    if (decoratedLitElement.__registered_states) return decoratedLitElement

    const updateableLitLikeElement = asUpdateableLitElement(litElement)

    const oldUpdated = updateableLitLikeElement.updated
    decoratedLitElement.__registered_states = {
        index: 0,
        count: 0,
        states: [],
        reducers: []
    }
    updateableLitLikeElement.updated = (args) => {
        decoratedLitElement.__registered_states.index = 0
        return oldUpdated(args)
    }
    return decoratedLitElement
}

export function withState(litElement: LitLikeElement, state: State<any>) {
    const decoratedLitElement = decorate(litElement)
    const {index, count} = decoratedLitElement.__registered_states
    if (index === count) {
        decoratedLitElement.__registered_states.index++
        decoratedLitElement.__registered_states.count++
        decoratedLitElement.__registered_states.states.push(state)
        return state
    }

    decoratedLitElement.__registered_states.index++
    return decoratedLitElement.__registered_states.states[index]
}

export function withReducer(litElement: LitLikeElement, reduce: Reduce<any>) {
    const decoratedLitElement = decorate(litElement)
    const {index, count, reducers} = decoratedLitElement.__registered_states
    if (index === count && !reducers[index-1]) {
        decoratedLitElement.__registered_states.reducers[index-1] = reduce
        return reduce
    }

    return decoratedLitElement.__registered_states.reducers[index-1]
}
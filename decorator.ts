import { LitLikeElement, DecoratedLitLikeElement, Dispatch, Reduce, UpdateableLitLikeElement } from "./types";

export function asUpdateableLitElement(element: LitLikeElement) {
    return element as unknown as UpdateableLitLikeElement
}

export function decorate(litElement: LitLikeElement) {
    const decoratedLitElement = (litElement as DecoratedLitLikeElement)
    if (decoratedLitElement.__registered_dispatchers) return decoratedLitElement

    const updateableLitLikeElement = asUpdateableLitElement(litElement)

    const oldUpdated = updateableLitLikeElement.updated
    decoratedLitElement.__registered_dispatchers = {
        index: 0,
        count: 0,
        dispatchers: [],
        reducers: []
    }
    updateableLitLikeElement.updated = (args) => {
        decoratedLitElement.__registered_dispatchers.index = 0
        return oldUpdated(args)
    }
    return decoratedLitElement
}

export function withDispatcher(litElement: LitLikeElement, dispatch: Dispatch<any>) {
    const decoratedLitElement = decorate(litElement)
    const {index, count} = decoratedLitElement.__registered_dispatchers
    if (index === count) {
        decoratedLitElement.__registered_dispatchers.index++
        decoratedLitElement.__registered_dispatchers.count++
        decoratedLitElement.__registered_dispatchers.dispatchers.push(dispatch)
        return dispatch
    }

    decoratedLitElement.__registered_dispatchers.index++
    return decoratedLitElement.__registered_dispatchers.dispatchers[index]
}

export function withReducer(litElement: LitLikeElement, reduce: Reduce<any>) {
    const decoratedLitElement = decorate(litElement)
    const {index, count, reducers} = decoratedLitElement.__registered_dispatchers
    if (index === count && !reducers[index-1]) {
        decoratedLitElement.__registered_dispatchers.reducers[index-1] = reduce
        return reduce
    }

    return decoratedLitElement.__registered_dispatchers.reducers[index-1]
}
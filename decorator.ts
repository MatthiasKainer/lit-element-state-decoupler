import { LitLikeElement, DecoratedLitLikeElement, InjectableState, Reduce, UpdateableLitLikeElement, StateOptions, Workflow } from "./types";

export function asUpdateableLitElement(element: LitLikeElement) {
    if (!element.dispatchEvent || !element.requestUpdate) throw new Error("Element missing required functions (dispatchEvent/requestUpdate)")
    return element as unknown as UpdateableLitLikeElement
}

const reservedField = "__registered_states";

export function decorate(litElement: LitLikeElement) {
    const decoratedLitElement = (litElement as DecoratedLitLikeElement)
    if (decoratedLitElement[reservedField]) return decoratedLitElement

    const updateableLitLikeElement = asUpdateableLitElement(litElement)

    const oldUpdated = updateableLitLikeElement.updated
    decoratedLitElement[reservedField] = {
        index: 0,
        count: 0,
        states: [],
        reducers: [],
        workflows: []
    }
    updateableLitLikeElement.updated = (args) => {
        decoratedLitElement[reservedField].index = 0
        return oldUpdated(args)
    }
    return decoratedLitElement
}

export function withState(litElement: LitLikeElement, state: InjectableState<any>, options: StateOptions = {}) {
    const decoratedLitElement = decorate(litElement)
    const {index, count} = decoratedLitElement[reservedField]
    if (index === count) {
        decoratedLitElement[reservedField].index++
        decoratedLitElement[reservedField].count++
        decoratedLitElement[reservedField].states.push(state)
        return state
    }

    decoratedLitElement[reservedField].index++
    if (options.updateDefault) decoratedLitElement[reservedField].states[index].inject(state.get())
    return decoratedLitElement[reservedField].states[index]
}

export function withReducer(litElement: LitLikeElement, reduce: Reduce<any>) {
    const decoratedLitElement = decorate(litElement)
    const {index, count, reducers} = decoratedLitElement[reservedField]
    if (index === count && !reducers[index-1]) {
        decoratedLitElement[reservedField].reducers[index-1] = reduce
        return reduce
    }

    return decoratedLitElement[reservedField].reducers[index-1]
}

export function withWorkflow(litElement: LitLikeElement, workflow: Workflow) {
    const decoratedLitElement = decorate(litElement)
    const {index, count, workflows} = decoratedLitElement[reservedField]
    if (index === count && !workflows[index-1]) {
        decoratedLitElement[reservedField].workflows[index-1] = workflow
        return workflow
    }

    return decoratedLitElement[reservedField].workflows[index-1]
}
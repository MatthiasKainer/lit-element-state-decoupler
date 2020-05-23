import { LitLikeElement, Reduce } from "./types";
import { useReducer } from "./reducer"

class StateExample { constructor(public value = "true") {} }

const exampleReducer = (state: StateExample, payload: unknown) => ({
    changeValue: () => ({...state, value: payload} as StateExample)
})

describe("Reducer", () => {
    let dispatcher: Reduce<StateExample>
    const litElement = {
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        dispatcher = useReducer<StateExample>(litElement, exampleReducer, initialState)
    })

    it("sets up the default state", () => {
        expect(dispatcher.getState()).toEqual(initialState)
        expect(dispatcher.getState()).not.toBe(initialState)
    })

    describe("when triggering an existing action", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            dispatcher.subscribe(subscriber)
            currentState = dispatcher.getState()
            dispatcher.publish("changeValue", "lala")
        })

        it("updates the state", () => {
            expect(dispatcher.getState()).toEqual({...currentState, value: "lala"})
            expect(dispatcher.getState()).not.toBe(currentState)
        })

        it("notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(1)
            expect(subscriber).toBeCalledWith({...currentState, value: "lala"})
        })

        it("refreshes the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(1)
        })
    })

    describe("when triggering a non-existing action", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            dispatcher.subscribe(subscriber)
            currentState = dispatcher.getState()
            dispatcher.publish("notexisting", "lala")
        })

        it("doesn't update the state", () => {
            expect(dispatcher.getState()).toEqual(currentState)
            expect(dispatcher.getState()).toBe(currentState)
        })

        it("doesn't notify any subscriber", () => {
            expect(subscriber).not.toBeCalled()
        })

        it("doesn't refresh the owning component", () => {
            expect(litElement.requestUpdate).not.toBeCalled()
        })
    })
})
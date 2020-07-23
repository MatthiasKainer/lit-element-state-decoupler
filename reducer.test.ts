import { LitLikeElement, Reduce } from "./types";
import { useReducer } from "./reducer"
import { asUpdateableLitElement } from "./decorator";

class StateExample { constructor(public value = "true") {} }

const exampleReducer = (state: StateExample) => ({
    changeValue: (payload: string) => ({...state, value: payload} as StateExample),
    otherAction: (payload: string) => ({...state, value: payload} as StateExample)
})

describe("Reducer", () => {
    let reducer: Reduce<StateExample>
    const litElement = {
        requestUpdate: jest.fn(),
        dispatchEvent: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        reducer = useReducer<StateExample>(litElement, exampleReducer, initialState)
    })

    it("sets up the default state", () => {
        expect(reducer.getState()).toEqual(initialState)
        expect(reducer.getState()).not.toBe(initialState)
    })

    describe("when triggering an existing action", () => {
        const subscriber = jest.fn()
        const when = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            reducer.subscribe(subscriber)
            reducer.when("changeValue", when)
            currentState = reducer.getState()
            reducer.publish("changeValue", "lala")
            reducer.publish("otherAction", "blablub")
        })

        it("updates the state", () => {
            expect(reducer.getState()).toEqual({...currentState, value: "blablub"})
            expect(reducer.getState()).not.toBe(currentState)
        })

        it("notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(2)
            expect(subscriber).toBeCalledWith("changeValue", {...currentState, value: "lala"})
            expect(subscriber).toBeCalledWith("otherAction", {...currentState, value: "blablub"})
        })        
        
        it("notifies any when", () => {
            expect(when).toBeCalledTimes(1)
            expect(when).toBeCalledWith({...currentState, value: "lala"})
        })

        it("refreshes the owning component every time", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(2)
        })

        it("dispatches a custom event if specfied in the options", () => {
            const reducer = useReducer(litElement, exampleReducer, initialState, { dispatchEvent: true })
            reducer.publish("changeValue", "lala")
            expect(litElement.dispatchEvent).toBeCalledTimes(1)
            const detail = reducer.getState();
            expect(litElement.dispatchEvent).toBeCalledWith(new CustomEvent("changeValue", { detail }))
            expect((litElement.dispatchEvent as jest.Mock).mock.calls[0][0].detail).toEqual(detail)
        })
    })

    describe("when triggering a non-existing action", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            reducer.subscribe(subscriber)
            currentState = reducer.getState()
            reducer.publish("notexisting", "lala")
        })

        it("doesn't update the state", () => {
            expect(reducer.getState()).toEqual(currentState)
            expect(reducer.getState()).toBe(currentState)
        })

        it("doesn't notify any subscriber", () => {
            expect(subscriber).not.toBeCalled()
        })

        it("doesn't refresh the owning component", () => {
            expect(litElement.requestUpdate).not.toBeCalled()
        })
        
        it("doesn't dispatch a custom event if specfied in the options", () => {
            const reducer = useReducer(litElement, exampleReducer, initialState, { dispatchEvent: true })
            reducer.publish("notexisting", "lala")
            expect(litElement.dispatchEvent).toBeCalledTimes(0)
        })
    })

})


describe("reducer - when overriding defaults", () => {
    let reducer: Reduce<StateExample>
    let litElement: LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        litElement = {
            requestUpdate: jest.fn(),
            dispatchEvent: jest.fn(),
            updated: jest.fn()
        } as unknown as LitLikeElement
    })

    it("should update the defaults on every call", () => {
        reducer = useReducer<StateExample>(litElement, exampleReducer, initialState, { updateDefault: true })
        expect(reducer.getState()).toEqual(initialState)
        reducer = useReducer<StateExample>(litElement, exampleReducer, {...initialState, value: "changed" }, { updateDefault: true })
        expect(reducer.getState()).toEqual({...initialState, value: "changed" })
    })
})

describe("reducer - reducer registration", () => {

    let reducer: Reduce<StateExample>
    let litElement: LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        litElement = {
            requestUpdate: jest.fn(),
            dispatchEvent: jest.fn(),
            updated: jest.fn()
        } as unknown as LitLikeElement
        reducer = useReducer<StateExample>(litElement, exampleReducer, initialState)
    })

    it("should retrieve the same reducer after an update", () => {
        asUpdateableLitElement(litElement).updated();
        const reducer1 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        asUpdateableLitElement(litElement).updated();
        const reducer2 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        expect(reducer1).toBe(reducer2)
        expect(reducer).toBe(reducer2)
    })

    it("should add multiple reducers between updates", () => {
        const reducer1 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        const reducer2 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        asUpdateableLitElement(litElement).updated();
        const retrieved0 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        const retrieved1 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        const retrieved2 = useReducer<StateExample>(litElement, exampleReducer, initialState)
        asUpdateableLitElement(litElement).updated();
        expect(retrieved0).toBe(reducer)
        expect(reducer1).toBe(retrieved1)
        expect(reducer2).toBe(retrieved2)
    })
})
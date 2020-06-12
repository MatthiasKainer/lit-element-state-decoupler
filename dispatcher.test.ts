import { useDispatcher } from "./dispatcher"
import { Dispatch, LitLikeElement } from "./types"
import { asUpdateableLitElement } from "./decorator"

class StateExample { constructor(public value = "true") {} }

describe("Dispatcher", () => {
    let dispatcher: Dispatch<StateExample>
    const litElement = {
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        dispatcher = useDispatcher<StateExample>(litElement, initialState)
    })

    it("sets up the default state", () => {
        expect(dispatcher.getState()).toEqual(initialState)
        expect(dispatcher.getState()).not.toBe(initialState)
    })

    it("sets the default state up correctly for different types", () => {
        expect(useDispatcher<string>(litElement, "bla").getState()).toBe("bla")
        expect(useDispatcher<number>(litElement, 3).getState()).toBe(3)
    })

    describe("When the state is published without change", () => {
        const subscriber = jest.fn()
        let state: StateExample

        beforeEach(() => {
            state = dispatcher.getState()
            dispatcher.subscribe(subscriber)
            dispatcher.publish(state)
        })

        it("does not update the state", () => {
            expect(dispatcher.getState()).toBe(state)
        })

        it("does not notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(0)
        })

        it("does not refresh the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(0)
        })
    })

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        beforeEach(() => {
            dispatcher.subscribe(subscriber)
            dispatcher.publish({ value: "new" })
        })

        it("updates the state", () => {
            expect(dispatcher.getState()).toEqual({ value: "new"})
        })

        it("notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(1)
            expect(subscriber).toBeCalledWith({ value: "new"})
        })

        it("refreshes the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(1)
        })
    })
})


describe("dispatcher - dispatcher registration", () => {

    let dispatcher: Dispatch<StateExample>
    let litElement: LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        litElement = {
            requestUpdate: jest.fn(),
            updated: jest.fn()
        } as unknown as LitLikeElement
        dispatcher = useDispatcher<StateExample>(litElement, initialState)
    })

    it("should retrieve the same dispatcher after an update", () => {
        asUpdateableLitElement(litElement).updated();
        const dispatcher1 = useDispatcher<StateExample>(litElement, initialState)
        asUpdateableLitElement(litElement).updated();
        const dispatcher2 = useDispatcher<StateExample>(litElement, initialState)
        expect(dispatcher1).toBe(dispatcher2)
        expect(dispatcher).toBe(dispatcher2)
    })

    it("should add multiple dispatchers between updateds", () => {
        const dispatcher1 = useDispatcher<string>(litElement, "initialState")
        const dispatcher2 = useDispatcher<number>(litElement, 42)
        asUpdateableLitElement(litElement).updated();
        const retrieved0 = useDispatcher<StateExample>(litElement, initialState)
        const retrieved1 = useDispatcher<string>(litElement, "otherState")
        const retrieved2 = useDispatcher<number>(litElement, 0)
        asUpdateableLitElement(litElement).updated();
        expect(retrieved0).toBe(dispatcher)
        expect(dispatcher1).toBe(retrieved1)
        expect(dispatcher2).toBe(retrieved2)
        expect(retrieved1.getState()).toBe("initialState")
        expect(retrieved2.getState()).toBe(42)
    })
})
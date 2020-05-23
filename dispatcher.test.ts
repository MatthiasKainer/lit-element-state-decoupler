import { useDispatcher } from "./dispatcher"
import { Dispatch, LitLikeElement } from "./types"

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

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        beforeEach(() => {
            dispatcher.subscribe(subscriber)
            dispatcher.publish({ value: "new" })
        })

        it("updates the state", () => {
            expect(dispatcher.getState()).toEqual({...initialState, value: "new"})
        })

        it("notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(1)
            expect(subscriber).toBeCalledWith({...initialState, value: "new"})
        })

        it("refreshes the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(1)
        })
    })
})

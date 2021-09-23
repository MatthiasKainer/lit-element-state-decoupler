import { useState } from "./state"
import { State, LitLikeElement, InjectableState } from "./types"
import { asUpdateableLitElement } from "./decorator"

class StateExample { constructor(public value = "true") {} }

describe("State get/set", () => {
    let state: State<StateExample>
    const litElement = {
        dispatchEvent: jest.fn(),
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        state = useState<StateExample>(litElement, initialState)
    })

    it("sets up the default state", () => {
        expect(state.get()).toEqual(initialState)
        expect(state.get()).not.toBe(initialState)
    })

    it("sets the default state up correctly for different types", () => {
        expect(useState<string>(litElement, "bla").get()).toBe("bla")
        expect(useState<number>(litElement, 3).get()).toBe(3)
    })

    describe("When the state is published without change", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            currentState = state.get()
            state.subscribe(subscriber)
            state.set(currentState)
        })

        it("does not update the state", () => {
            expect(state.get()).toBe(currentState)
        })

        it("does not notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(0)
        })

        it("does not refresh the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(0)
        })
    })

    describe("When state is injected", () => {
        const subscriber = jest.fn()
        let newState: StateExample = {value: "changed"}

        beforeEach(() => {
            state.subscribe(subscriber);
            (state as InjectableState<StateExample>).inject(newState)
        })
        it("should change the state", () => {
            expect(state.get()).toBe(newState)
        })
        it("should change it without notification", () => {
            expect(subscriber).not.toBeCalled()
        })
    })

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        beforeEach(() => {
            state.subscribe(subscriber)
            state.set({ value: "new" })
        })

        it("updates the state", () => {
            expect(state.get()).toEqual({ value: "new"})
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

describe("State value", () => {
    let state: State<StateExample>
    const litElement = {
        dispatchEvent: jest.fn(),
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        state = useState<StateExample>(litElement, initialState)
    })

    it("sets up the default state", () => {
        expect(state.value).toEqual(initialState)
        expect(state.value).not.toBe(initialState)
    })

    it("sets the default state up correctly for different types", () => {
        expect(useState<string>(litElement, "bla").value).toBe("bla")
        expect(useState<number>(litElement, 3).value).toBe(3)
    })

    describe("When the state is published without change", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            currentState = state.get()
            state.subscribe(subscriber)
            state.value = currentState
        })

        it("does not update the state", () => {
            expect(state.value).toBe(currentState)
        })

        it("does not notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(0)
        })

        it("does not refresh the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(0)
        })
    })

    describe("When state is injected", () => {
        const subscriber = jest.fn()
        let newState: StateExample = {value: "changed"}

        beforeEach(() => {
            state.subscribe(subscriber);
            (state as InjectableState<StateExample>).inject(newState)
        })
        it("should change the state", () => {
            expect(state.value).toBe(newState)
        })
        it("should change it without notification", () => {
            expect(subscriber).not.toBeCalled()
        })
    })

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        beforeEach(() => {
            state.subscribe(subscriber)
            state.value = { value: "new" }
        })

        it("updates the state", () => {
            expect(state.value).toEqual({ value: "new"})
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
describe("State legacy retrieving", () => {
    let state: State<StateExample>
    const litElement = {
        dispatchEvent: jest.fn(),
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        state = useState<StateExample>(litElement, initialState)
    })

    it("sets up the default state", () => {
        expect(state.getState()).toEqual(initialState)
        expect(state.getState()).not.toBe(initialState)
    })

    it("sets the default state up correctly for different types", () => {
        expect(useState<string>(litElement, "bla").getState()).toBe("bla")
        expect(useState<number>(litElement, 3).getState()).toBe(3)
    })

    describe("When the state is published without change", () => {
        const subscriber = jest.fn()
        let currentState: StateExample

        beforeEach(() => {
            currentState = state.get()
            state.subscribe(subscriber)
            state.value = currentState
        })

        it("does not update the state", () => {
            expect(state.getState()).toBe(currentState)
        })

        it("does not notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(0)
        })

        it("does not refresh the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(0)
        })
    })

    describe("When state is injected", () => {
        const subscriber = jest.fn()
        let newState: StateExample = {value: "changed"}

        beforeEach(() => {
            state.subscribe(subscriber);
            (state as InjectableState<StateExample>).inject(newState)
        })
        it("should change the state", () => {
            expect(state.getState()).toBe(newState)
        })
        it("should change it without notification", () => {
            expect(subscriber).not.toBeCalled()
        })
    })

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        beforeEach(() => {
            state.subscribe(subscriber)
            state.publish({ value: "new" })
        })

        it("updates the state", () => {
            expect(state.getState()).toEqual({ value: "new"})
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

describe("State mixed between value and get/set", () => {
    let state: State<StateExample>
    const litElement = {
        dispatchEvent: jest.fn(),
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        state = useState<StateExample>(litElement, initialState)
    })

    it("sets up the default state", () => {
        expect(state.value).toBe(state.get())
    })

    describe("When the state is changed", () => {
        const subscriber = jest.fn()

        describe("on value", () => {
            beforeEach(() => {
                state.subscribe(subscriber)
                state.value = { value: "new" }
            })

            it("updates the state on the get", () => {
                expect(state.get()).toEqual({ value: "new"})
            })
        })

        describe("on set", () => {
            beforeEach(() => {
                state.subscribe(subscriber)
                state.set({ value: "new" })
            })

            it("updates the state on the value", () => {
                expect(state.value).toEqual({ value: "new"})
            })
        })
    })
})


describe("state - state registration", () => {

    let state: State<StateExample>
    let litElement: LitLikeElement
    const initialState = { value: "bla", other: "blub" }

    beforeEach(() => {
        jest.resetAllMocks()
        litElement = {
            dispatchEvent: jest.fn(),
            requestUpdate: jest.fn(),
            updated: jest.fn()
        } as unknown as LitLikeElement
        state = useState<StateExample>(litElement, initialState)
    })

    it("should retrieve the same state after an update", () => {
        asUpdateableLitElement(litElement).updated();
        const state1 = useState<StateExample>(litElement, initialState)
        asUpdateableLitElement(litElement).updated();
        const state2 = useState<StateExample>(litElement, initialState)
        expect(state1).toBe(state2)
        expect(state).toBe(state2)
    })

    it("should add multiple states between updateds", () => {
        const state1 = useState<string>(litElement, "initialState")
        const state2 = useState<number>(litElement, 42)
        asUpdateableLitElement(litElement).updated();
        const retrieved0 = useState<StateExample>(litElement, initialState)
        const retrieved1 = useState<string>(litElement, "otherState")
        const retrieved2 = useState<number>(litElement, 0)
        asUpdateableLitElement(litElement).updated();
        expect(retrieved0).toBe(state)
        expect(state1).toBe(retrieved1)
        expect(state2).toBe(retrieved2)
        expect(retrieved1.get()).toBe("initialState")
        expect(retrieved2.get()).toBe(42)
    })
})

describe("State - string type", () => {
    let state: State<string>
    const litElement = {
        dispatchEvent: jest.fn(),
        requestUpdate: jest.fn()
    } as unknown as LitLikeElement
    const subscriber = jest.fn()
    const initialState = ""

    beforeEach(() => {
        jest.resetAllMocks()
        state = useState<string>(litElement, initialState)
        state.subscribe(subscriber)
        state.set("new")
    })

    it("notifies any subscriber", () => {
        expect(subscriber).toBeCalledTimes(1)
        expect(subscriber).toBeCalledWith("new")
    })

    it("refreshes the owning component", () => {
        expect(litElement.requestUpdate).toBeCalledTimes(1)
    })

    describe("When the state is changed and then the default is published again", () => {

        beforeEach(() => {
            state.set(initialState)
        })

        it("resets to the default state", () => {
            expect(state.get()).toEqual(initialState)
        })
        
        it("notifies any subscriber", () => {
            expect(subscriber).toBeCalledTimes(2)
            expect(subscriber).toBeCalledWith("")
        })
    
        it("refreshes the owning component", () => {
            expect(litElement.requestUpdate).toBeCalledTimes(2)
        })
    });})
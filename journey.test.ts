import { LitLikeElement } from "./types"
import { useState } from "./state"
import { useReducer } from "./reducer"

type LitLikeElementWithRender = LitLikeElement & {
    render: () => void,
    onRender: (render: () => void) => void
    updated: () => void
}

const exampleReducer = (_: string) => ({
    change: (payload: string) => Promise.resolve(payload)
})

describe("A lit element with reducers and states", () => {
    let litElement: LitLikeElementWithRender
    
    beforeEach(() => {
        jest.resetAllMocks()
        litElement = {
            requestUpdate: () => {
                litElement.render();
                litElement.updated();
            },
            dispatchEvent: jest.fn(),
            updateComplete: Promise.resolve(),
            updated: jest.fn(),
            render: jest.fn(),
            onRender: async (render: () => void) => {
                litElement.render = () => {
                    render();
                }
            }
        } as LitLikeElementWithRender
    })

    it("should register the states/reducers correctly", async () => {
        let currentState: string = ""
        let currentReducerState: string = ""
        let triggerStateChange = (newValue: string) => console.log(newValue)
        let triggerReducerChange = (action: string, newValue: string) => Promise.resolve((console.log(action, newValue), "bla"))
        litElement.onRender(() => {
            const state = useState(litElement, "initial");
            currentState = state.get()
            triggerStateChange = state.set
            const reducer = useReducer(litElement, exampleReducer, "initial")
            currentReducerState = reducer.get()
            triggerReducerChange = reducer.set
        })

        litElement.requestUpdate()
        expect(currentReducerState).toBe("initial")
        expect(currentState).toBe("initial")

        // a change will trigger a re-render, so the value should be changed and kept
        triggerStateChange("lala")
        expect(currentState).toBe("lala")
        expect(currentReducerState).toBe("initial")
        
        await triggerReducerChange("change", "tata")
        expect(currentState).toBe("lala")
        expect(currentReducerState).toBe("tata")
    })
})
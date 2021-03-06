import { LitLikeElement } from "./types"
import { useState } from "./state"
import { useReducer } from "./reducer"

type LitLikeElementWithRender = LitLikeElement & {
    render: () => void,
    onRender: (render: () => void) => void
    updated: () => void
}

const exampleReducer = (_: string) => ({
    change: (payload: string) => payload
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
            updated: jest.fn(),
            render: jest.fn(),
            onRender: async (render: () => void) => {
                litElement.render = () => {
                    render();
                }
            }
        } as LitLikeElementWithRender
    })

    it("should register the states/reducers correctly", () => {
        let currentState: string = ""
        let currentReducerState: string = ""
        let triggerStateChange = (newValue: string) => console.log(newValue)
        let triggerReducerChange = (action: string, newValue: string) => console.log(action, newValue)
        litElement.onRender(() => {
            const state = useState(litElement, "initial");
            currentState = state.getState()
            triggerStateChange = state.publish
            const reducer = useReducer(litElement, exampleReducer, "initial")
            currentReducerState = reducer.getState()
            triggerReducerChange = reducer.publish
        })

        litElement.requestUpdate()
        expect(currentReducerState).toBe("initial")
        expect(currentState).toBe("initial")

        // a change will trigger a re-render, so the value should be changed and kept
        triggerStateChange("lala")
        expect(currentState).toBe("lala")
        expect(currentReducerState).toBe("initial")
        
        triggerReducerChange("change", "tata")
        expect(currentState).toBe("lala")
        expect(currentReducerState).toBe("tata")
    })
})
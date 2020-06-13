import { LitLikeElement } from "./types"
import { useDispatcher } from "./dispatcher"
import { useReducer } from "./reducer"

type LitLikeElementWithRender = LitLikeElement & {
    render: () => void,
    onRender: (render: () => void) => void
    updated: () => void
}

const exampleReducer = (_: string) => ({
    change: (payload: string) => payload
})

describe("A lit element with reducers and dispatchers", () => {
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

    it("should register the dispatchers/reducers correctly", () => {
        let currentDispatcherState: string = ""
        let currentReducerState: string = ""
        let triggerDispatcherChange = (newValue: string) => console.log(newValue)
        let triggerReducerChange = (action: string, newValue: string) => console.log(action, newValue)
        litElement.onRender(() => {
            const dispatcher = useDispatcher(litElement, "initial");
            currentDispatcherState = dispatcher.getState()
            triggerDispatcherChange = dispatcher.publish
            const reducer = useReducer(litElement, exampleReducer, "initial")
            currentReducerState = reducer.getState()
            triggerReducerChange = reducer.publish
        })

        litElement.requestUpdate()
        expect(currentReducerState).toBe("initial")
        expect(currentDispatcherState).toBe("initial")

        // a change will trigger a re-render, so the value should be changed and kept
        triggerDispatcherChange("lala")
        expect(currentDispatcherState).toBe("lala")
        expect(currentReducerState).toBe("initial")
        
        triggerReducerChange("change", "tata")
        expect(currentDispatcherState).toBe("lala")
        expect(currentReducerState).toBe("tata")
    })
})
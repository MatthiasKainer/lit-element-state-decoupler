import { useReducer } from ".";
import { withWorkflow } from "./decorator";
import { LitLikeElement, Reduce, Reducer, Workflow, WorkflowHistory } from "./types"

type InnerReducers = { [key: string]: Reduce<any> }
type Compensation = { [key: string]: unknown[] }
type Sideeffects = { [key: string]: ((data?: unknown) => Promise<unknown>)[] }

const isFunction = (val: unknown): val is Reducer<any> => Object.prototype.toString.call(val) === "[object Function]"

const parseActivity = async (key: string) => new Promise<string[]>((resolve, reject) => {
    if (key.indexOf(".") <= 0) reject("Incorrect format. Needs an object format (reducer.function)")
    const elements = key.split(".")
    if (elements.length > 2) reject("Incorrect format. Needs an object format (reducer.function)")
    return resolve(elements)
})

export const useWorkflow = (element: LitLikeElement, reducers: { [key: string]: {reducer: Reducer<any>, initialState: unknown} }): Workflow => {
    // Add the reducers to the element, and store their reference
    const innerReducers = Object.entries(reducers).reduce((prev, [projection, argument]) =>{
        if (isFunction(argument)) {
            prev[projection] = useReducer(element, argument, undefined)
        }
        else {
            const {reducer, initialState} = argument;
            prev[projection] = useReducer(element, reducer, initialState)
        }
        return prev;
    }, {} as InnerReducers)
        
    const sideeffect: Sideeffects = {}
    const compensations: Compensation = {}
    const workflowHistory: WorkflowHistory[] = []

    const view = (key: string) => {
        workflowHistory.push({
            type: "view",
            args: [key]
        })
        return (innerReducers[key]) ? innerReducers[key].get() : undefined
    }


    const onCancel = (activity: string, data?: unknown) => {
        workflowHistory.push({
            type: "onCancel",
            args: [activity, data]
        })
        compensations[activity] = [
            ...(compensations[activity] || []),
            data
        ];
    }

    const trigger = async (activity: string | string[], data?: unknown) => {
        const activities = Array.isArray(activity) ? activity : [activity]

        for (const activity of activities) {
            const [_reducer, _action] = await parseActivity(activity)
            workflowHistory.push({
                type: "trigger",
                args: [activity, data]
            })
            await Promise.all(sideeffect[activity]?.map(effect => effect(data)) ?? [])
            if (_reducer === "*") {
                for (const reducer of Object.values(innerReducers)) {
                    await reducer.dispatch(_action, data)
                }
            } else {
                await innerReducers[_reducer].dispatch(_action, data)            
            }
        }

        return {
            onUndo: onCancel
        }
    }

    const addSideeffect = (activity: string, effect: (data?: unknown) => Promise<unknown>) => {
        workflowHistory.push({
            type: "addSideeffect",
            args: [activity, effect]
        })
        sideeffect[activity] = [
            ...(sideeffect[activity] || []),
            effect
        ];
    }

    const cancel = async () => {
        workflowHistory.push({
            type: "cancel",
            args: []
        })
        for (const [activity, dataArguments] of Object.entries(compensations)) {
            const [_reducer, _action] = await parseActivity(activity)
            for (const data of dataArguments) {
                
                if (_reducer === "*") {
                    for (const reducer of Object.values(innerReducers)) {
                        await reducer.dispatch(_action, data)
                    }
                } else {
                    await innerReducers[_reducer].dispatch(_action, data)            
                }
            }
        }
    }

    const after = (timeout: Date, unlessActivity: WorkflowHistory, execute: () => Promise<unknown>) => {
        workflowHistory.push({
            type: "after",
            args: [timeout, unlessActivity, execute]
        })
        const compareWorkflow = (entry: WorkflowHistory, unless: WorkflowHistory) => {
            if (entry.type !== unless.type) return false;
            for (let arg = 0; arg < unless.args.length; arg++) {
                if (entry.args[arg] !== unless.args[arg]) return false;
            }
            return true;
        }
        const check = async () => {
            if (workflowHistory.some(entry => compareWorkflow(entry, unlessActivity))) {
                return;
            } else if (new Date(Date.now()) > timeout) {
                await execute()
            } else {
                setTimeout(check, 100)
            }
        }
        check()
    }

    const plan = async <T>(plan: { [entity: string]: () => Promise<T> }) => {
        for (const [entity, workflow] of Object.entries(plan)) {
            if (reducers[entity] &&
                JSON.stringify(view(entity)) === JSON.stringify(reducers[entity].initialState)) {
                return await workflow()
            }
        }
        const toState = () => 
            Object.entries(innerReducers).reduce((result, [key, reducer]) => {
                result[key] = reducer.get();
                return result;
            }, {} as {[key:string]: unknown})

        element.dispatchEvent(new CustomEvent("WorkflowCompleted", { detail: toState() }))
        return plan[""]
            ? await plan[""]()
            : Promise.resolve(null)
    }

    return withWorkflow(element, {
        trigger,
        addSideeffect,
        view,
        onCancel,
        cancel,
        after,
        executePlan: plan,
        history: () => [...workflowHistory]
    })
}
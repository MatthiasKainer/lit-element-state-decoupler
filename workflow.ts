import { useReducer } from ".";
import { withWorkflow } from "./decorator";
import { LitLikeElement, Reduce, Reducer, Workflow, WorkflowHistory } from "./types"

type InnerReducers = { [key: string]: Reduce<any> }
type Compensation = { [key: string]: unknown[] }
type Sideeffects = { [key: string]: ((data?: unknown) => Promise<unknown>)[] }

export const useWorkflow = (element: LitLikeElement, reducers: { [key: string]: {reducer: Reducer<any>, initialState: unknown} }): Workflow => {
    const innerReducers = Object.entries(reducers).reduce((prev, [projection, {reducer, initialState}]) =>
        (prev[projection] = useReducer(element, reducer, initialState), prev)
        , {} as InnerReducers)
    const sideeffect: Sideeffects = {}
    const compensations: Compensation = {}
    const workflowHistory: WorkflowHistory[] = []

    const projections = (key: string) => {
        workflowHistory.push({
            type: "projections",
            args: [key]
        })
        return (innerReducers[key]) ? innerReducers[key].get() : undefined
    }

    const addActivity = async (activity: string, data?: unknown) => {
        workflowHistory.push({
            type: "addActivity",
            args: [activity, data]
        })
        await Promise.all(sideeffect[activity]?.map(effect => effect(data)) ?? [])
        for (const reducer of Object.values(innerReducers)) {
            await reducer.dispatch(activity, data)
        }
    }

    const addCompensation = (activity: string, data?: unknown) => {
        workflowHistory.push({
            type: "addCompensation",
            args: [activity, data]
        })
        compensations[activity] = [
            ...(compensations[activity] || []),
            data
        ];
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

    const compensate = async () => {
        workflowHistory.push({
            type: "compensate",
            args: []
        })
        for (const [activity, dataArguments] of Object.entries(compensations)) {
            for (const data of dataArguments) {
                for (const reducer of Object.values(innerReducers)) {
                    await reducer.dispatch(activity, data)
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

    const plan = async <T>(plan: {[entity: string]: () => Promise<T>}) => {
        for (const [entity, workflow] of Object.entries(plan)) {
            if (reducers[entity] &&
                JSON.stringify(projections(entity)) === JSON.stringify(reducers[entity].initialState)) {
                return await workflow()
            }
        }
        return plan[""] 
            ? await plan[""]() 
            : Promise.resolve(null)
    }

    return withWorkflow(element, {
        addActivity,
        addSideeffect,
        projections,
        addCompensation,
        compensate,
        after,
        plan,
        history: () => [...workflowHistory]
    })
}
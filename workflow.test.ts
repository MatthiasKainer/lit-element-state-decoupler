import { Reducer } from ".";
import { LitLikeElement, Workflow } from "./types"
import { useWorkflow } from "./workflow";

type Customer = {
    userName: string
}

type Contract = {
    contractNumber: number,
    userName: string
    created: Date
    ends: Date
}

type ErrorCodes = "NOT_FOUND" | "CONFLICT"
class Rejection<T> {
    code: ErrorCodes
    message: string
    state: T

    constructor(code: ErrorCodes, message: string, state: T) {
        this.code = code;
        this.message = message
        this.state = state
    }

    public toString() {
        return `[${this.code}] ${this.message}`;
    }
}

const notFound = <T>(who: string, state: T) => (console.log(`${who} not found`, state), new Rejection("NOT_FOUND", `${who} not found`, state));
const conflict = <T>(who: string, state: T) => (console.log(`${who} already exists`, state), new Rejection("CONFLICT", `${who} already exists`, state));

const customersReducer: Reducer<Customer[]> = (state: Customer[]) => ({
    createCustomer: (userName: string) => {
        return new Promise((resolve, reject) => {
            if (state.some(customer => customer.userName === userName)) return reject(conflict("User", state));
            return resolve([...state, { userName }] as Customer[])
        });
    },
    changeCustomerName: ({ oldName, userName }: { oldName: string, userName: string }) => new Promise((resolve, reject) => {
        const index = state.findIndex((customer) => customer.userName === oldName);
        if (index < 0) return reject(notFound("User", state));
        state[index] = { ...state[index], userName }
        return resolve([...state] as Customer[])
    }),
    deleteCustomer: (userName: string) => new Promise((resolve, reject) => {
        const index = state.findIndex((customer) => customer.userName === userName);
        if (index < 0) return (reject(notFound("User", state)));
        state.splice(index, 1)
        return resolve([...state] as Customer[])
    })
})

const contractReducer: Reducer<Contract[]> = (state: Contract[]) => ({
    createContract: ({ contractNumber, userName, runtime }: { contractNumber: number, userName: string, runtime: number }) => new Promise((resolve, reject) => {
        if (state.some(contract => contract.contractNumber === contractNumber)) return reject(conflict("Contract", state));
        const created = new Date(Date.now())
        // contract always starts at the beginning of the month
        created.setDate(1)
        const ends = new Date(created)
        ends.setMonth(ends.getMonth() + runtime)
        return resolve([
            ...state,
            { contractNumber, userName: userName, created, ends }
        ])
    }),
    changeCustomerName: ({ oldName, userName }: { oldName: string, userName: string }) => new Promise((resolve) =>
        resolve(state.map(contract =>
            (contract.userName === oldName) ? { ...contract, userName } : contract
        ))
    ),
    removeContract: (contractNumber: number) => new Promise((resolve, reject) => {
        const index = state.findIndex(contract => contract.contractNumber === contractNumber);
        if (index < 0) return reject(notFound("Contract", state));
        state.splice(index, 1)
        return resolve([...state])
    })
})

describe("Given I have a workflow", () => {

    let workflow: Workflow;


    beforeEach(() => {
        jest.resetAllMocks()
        const litElement = {
            requestUpdate: jest.fn(),
            dispatchEvent: jest.fn()
        } as unknown as LitLikeElement
        workflow = useWorkflow(litElement, {
            customers: { reducer: customersReducer, initialState: [] },
            contracts: { reducer: contractReducer, initialState: [] }
        })
    })

    it("returns undefined for non-existing projections (probably a bad idea, let's think about something better)", () => {
        expect(workflow.projections("made up")).toEqual(undefined)
    })

    it("executes every step when all go well", async () => {
        let userName = "Mustermann"
        await workflow.addActivity("createCustomer", userName);
        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([])

        const contractNumber = 1
        await workflow.addActivity("createContract", { userName, contractNumber, runtime: 3 });
        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        userName = "Klaus"
        await workflow.addActivity("changeCustomerName", { oldName: "Mustermann", userName })
        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        workflow.addSideeffect("deleteCustomer", async (userName) =>
            await Promise.all((workflow.projections("contracts") as Contract[])
                .filter(contract => contract.userName === userName)
                .map(({ contractNumber }) => workflow.addActivity("removeContract", contractNumber)))
        )
        await workflow.addActivity("deleteCustomer", userName)
        expect(workflow.projections("customers")).toEqual([])
        expect(workflow.projections("contracts")).toEqual([])

        expect(workflow.history()).toMatchSnapshot()
    })

    it("compensates if a step fails", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.addActivity("createCustomer", userName);
        workflow.addCompensation("deleteCustomer", userName);
        await workflow.addActivity("createContract", { userName, contractNumber, runtime: 3 });
        workflow.addCompensation("removeContract", contractNumber);

        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we just want to avoid it gets triggered right away, just for readability
        const days = (_: number) => {
            const future = new Date();
            future.setMilliseconds(future.getMilliseconds() + 100);
            return future
        }

        workflow.after(days(1), { type: "confirmedEmail", args: [userName] }, async () => await workflow.compensate())
        await new Promise(resolve => setTimeout(resolve, 500))

        // compensation should have happenend
        expect(workflow.projections("customers")).toEqual([])
        expect(workflow.projections("contracts")).toEqual([])
        expect(workflow.history().some(entry => entry.type === "compensate")).toBeTruthy()

    })

    it("does not compensates if all step pass on a full history match", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.addActivity("createCustomer", userName);
        workflow.addCompensation("deleteCustomer", userName);
        await workflow.addActivity("createContract", { userName, contractNumber, runtime: 3 });
        workflow.addCompensation("removeContract", contractNumber);

        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we want that to be now anyways, just for readability
        const days = (_: number) => new Date(0);

        // it should not matter if an activity has happened before or after in a workflow
        //  this way we won't have timing issues as after will be executed right away
        await workflow.addActivity("confirmedEmail", userName);

        workflow.after(days(1), { type: "addActivity", args: ["confirmedEmail", userName] }, async () => await workflow.compensate())

        // should not be componsated
        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])
        expect(workflow.history().some(entry => entry.type === "compensate")).toBeFalsy()

    })
    it("does not compensates if all step pass when checking for the start of a history entry", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.addActivity("createCustomer", userName);
        workflow.addCompensation("deleteCustomer", userName);
        await workflow.addActivity("createContract", { userName, contractNumber, runtime: 3 });
        workflow.addCompensation("removeContract", contractNumber);

        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we want that to be now anyways, just for readability
        const days = (_: number) => new Date(0);

        // it should not matter if an activity has happened before or after in a workflow
        //  this way we won't have timing issues as after will be executed right away
        await workflow.addActivity("confirmedEmail", userName);

        workflow.after(days(1), { type: "addActivity", args: ["confirmedEmail"] }, async () => await workflow.compensate())

        // should not be componsated
        expect(workflow.projections("customers")).toEqual([{ userName }])
        expect(workflow.projections("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])
        expect(workflow.history().some(entry => entry.type === "compensate")).toBeFalsy()

    })
})

describe("Given I plan a workflow", () => {
    let workflow: Workflow;


    beforeEach(() => {
        jest.resetAllMocks()
        const litElement = {
            requestUpdate: jest.fn(),
            dispatchEvent: jest.fn()
        } as unknown as LitLikeElement
        workflow = useWorkflow(litElement, {
            customers: { reducer: customersReducer, initialState: [] },
            contracts: { reducer: contractReducer, initialState: [] }
        })
    })

    it("executes the plan in the correct order", async () => {
        const mockTrace = jest.fn();
        const userName = "name"
        const contractNumber = 1
        const plan = {
            customers: async () => {
                await workflow.addActivity("createCustomer", userName);
                mockTrace("customer")
                return "customer"
            },
            contracts: async () => {
                await workflow.addActivity("createContract", { userName, contractNumber, runtime: 3 });
                mockTrace("contracts")
                return "contracts"
            },
            "" : async () => {
                mockTrace("done")
                return "done"
            }
        }
        let result = await workflow.plan(plan)

        await new Promise(process.nextTick)

        expect(mockTrace.mock.calls[0][0]).toBe("customer")
        result = await workflow.plan(plan)
        expect(mockTrace.mock.calls[1][0]).toBe("contracts")
        result = await workflow.plan(plan)
        expect(result).toBe("done")
    })

    it("finishes a plan with an empty last result if none given", async () => {
        const mockTrace = jest.fn();
        const plan = {
            customers: async () => {
                await workflow.addActivity("createCustomer", "name");
                mockTrace("customer")
                return "customer"
            },
            madeUp: async () => "made up!"
        }
        let result = await workflow.plan(plan)

        await new Promise(process.nextTick)

        expect(mockTrace.mock.calls[0][0]).toBe("customer")
        result = await workflow.plan(plan)
        expect(result).toBe(null)
    })
})
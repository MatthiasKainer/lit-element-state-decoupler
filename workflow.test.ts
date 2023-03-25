import { customersReducer, contractReducer, Contract, Customer } from "./test-helpers/workflows";
import { LitLikeElement, Workflow } from "./types"
import { useWorkflow } from "./workflow";

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
        expect(workflow.view("correct.but non existant")).toEqual(undefined)
    })

    it.each([
        ["lala", "Incorrect format. Needs an object format (reducer.function)"],
        ["lala.a.blala", "Incorrect format. Needs an object format (reducer.function)"]
    ])("fails if the activity has the incorrect format %s", async (action, error) => {
        expect.assertions(1);
        try {
            await workflow.trigger(action);
        } catch (e) {
            expect(e).toMatch(error);
        }
    });

    it("executes every step when all go well", async () => {
        let userName = "Mustermann"
        await workflow.trigger("customers.createCustomer", userName);
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([])

        const contractNumber = 1
        await workflow.trigger("contracts.createContract", { userName, contractNumber, runtime: 3 });
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // multiple actions can be called as list
        userName = "Klaus"
        await workflow.trigger(["customers.changeCustomerName", "contracts.changeCustomerName"], { oldName: "Mustermann", userName })
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // or by wildcard
        userName = "Sepp"
        await workflow.trigger("*.changeCustomerName", { oldName: "Klaus", userName })
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        workflow.addSideeffect("customers.deleteCustomer", async (userName) =>
            await Promise.all((workflow.view("contracts") as Contract[])
                .filter(contract => contract.userName === userName)
                .map(({ contractNumber }) => workflow.trigger("contracts.removeContract", contractNumber)))
        )
        await workflow.trigger("customers.deleteCustomer", userName)
        expect(workflow.view("customers")).toEqual([])
        expect(workflow.view("contracts")).toEqual([])

        expect(workflow.history()).toMatchSnapshot()
    })

    it("compensates if a step fails", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.trigger("customers.createCustomer", userName);
        workflow.onCancel("customers.deleteCustomer", userName);
        await workflow.trigger("contracts.createContract", { userName, contractNumber, runtime: 3 });
        workflow.onCancel("contracts.removeContract", contractNumber);

        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we just want to avoid it gets triggered right away so we are testing the timeout
        const days = (days: number) => {
            const future = new Date();
            future.setMilliseconds(future.getMilliseconds() + days);
            return future
        }

        workflow.after(days(1), { type: "customers.confirmedEmail", args: [userName] }, async () => await workflow.cancel())
        await new Promise(resolve => setTimeout(resolve, 500))

        // compensation should have happenend
        expect(workflow.history().some(entry => entry.type === "cancel")).toBeTruthy()
        expect(workflow.view("contracts")).toEqual([])
        expect(workflow.view("customers")).toEqual([])
    })

    it("compensates a wildcard compensation if a step fails", async () => {

        const userName = "Mustermann"
        const contractNumber = 1
        const litElement = {
            requestUpdate: jest.fn(),
            dispatchEvent: jest.fn()
        } as unknown as LitLikeElement
        const customer: Customer = {userName}
        const contract: Contract = {contractNumber, userName, created: new Date(), ends: new Date() }
        workflow = useWorkflow(litElement, {
            customers: { reducer: customersReducer, initialState: [customer] },
            contracts: { reducer: contractReducer, initialState: [contract] }
        })
        const days = (days: number) => {
            const future = new Date();
            future.setMilliseconds(future.getMilliseconds() + days);
            return future
        }

        // change username
        const newUserName = "Sepp"
        await workflow.trigger("*.changeCustomerName", { oldName: userName, userName: newUserName })
        workflow.onCancel("*.changeCustomerName", { oldName: newUserName, userName: userName });
        expect(workflow.view("customers")).not.toEqual([customer])
        expect(workflow.view("contracts")).not.toEqual([contract])

        // if not confirmed after x, undo
        workflow.after(days(1), { type: "customers.confirmedNameChange", args: [userName] }, async () => await workflow.cancel())
        await new Promise(resolve => setTimeout(resolve, 500))

        expect(workflow.view("customers")).toEqual([customer])
        expect(workflow.view("contracts")).toEqual([contract])
    })

    it("does not compensates if all step pass on a full history match", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.trigger("customers.createCustomer", userName);
        workflow.onCancel("customers.deleteCustomer", userName);
        await workflow.trigger("contracts.createContract", { userName, contractNumber, runtime: 3 });
        workflow.onCancel("contracts.removeContract", contractNumber);

        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we want that to be now anyways, just for readability
        const days = (_: number) => new Date(0);

        // it should not matter if an activity has happened before or after in a workflow
        //  this way we won't have timing issues as after will be executed right away
        await workflow.trigger("customers.confirmedEmail", userName);

        workflow.after(days(1), { type: "trigger", args: ["customers.confirmedEmail", userName] }, async () => await workflow.cancel())

        // should not be componsated
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])
        expect(workflow.history().some(entry => entry.type === "cancel")).toBeFalsy()

    })
    it("does not compensates if all step pass when checking for the start of a history entry", async () => {
        let userName = "Mustermann"
        const contractNumber = 1
        await workflow.trigger("customers.createCustomer", userName);
        workflow.onCancel("customers.deleteCustomer", userName);
        await workflow.trigger("contracts.createContract", { userName, contractNumber, runtime: 3 });
        workflow.onCancel("contracts.removeContract", contractNumber);

        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])

        // we want that to be now anyways, just for readability
        const days = (_: number) => new Date(0);

        // it should not matter if an activity has happened before or after in a workflow
        //  this way we won't have timing issues as after will be executed right away
        await workflow.trigger("customers.confirmedEmail", userName);

        workflow.after(days(1), { type: "trigger", args: ["confirmedEmail"] }, async () => await workflow.cancel())

        // should not be componsated
        expect(workflow.view("customers")).toEqual([{ userName }])
        expect(workflow.view("contracts")).toEqual([{ contractNumber, "created": expect.any(Date), "ends": expect.any(Date), userName }])
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
                await workflow.trigger("customers.createCustomer", userName);
                mockTrace("customer")
                return "customer"
            },
            contracts: async () => {
                await workflow.trigger("contracts.createContract", { userName, contractNumber, runtime: 3 });
                mockTrace("contracts")
                return "contracts"
            },
            "": async () => {
                mockTrace("done")
                return "done"
            }
        }
        let result = await workflow.executePlan(plan)

        await new Promise(process.nextTick)

        expect(mockTrace.mock.calls[0][0]).toBe("customer")
        result = await workflow.executePlan(plan)
        expect(mockTrace.mock.calls[1][0]).toBe("contracts")
        result = await workflow.executePlan(plan)
        expect(result).toBe("done")
    })

    it("finishes a plan with an empty last result if none given", async () => {
        const mockTrace = jest.fn();
        const plan = {
            customers: async () => {
                await workflow.trigger("customers.createCustomer", "name");
                mockTrace("customer")
                return "customer"
            },
            madeUp: async () => "made up!"
        }
        let result = await workflow.executePlan(plan)

        await new Promise(process.nextTick)

        expect(mockTrace.mock.calls[0][0]).toBe("customer")
        result = await workflow.executePlan(plan)
        expect(result).toBe(null)
    })
})

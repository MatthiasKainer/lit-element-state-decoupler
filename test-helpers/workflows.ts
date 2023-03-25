import { Reducer } from "../types"

export type Customer = {
    userName: string
}

export type Contract = {
    contractNumber: number,
    userName: string
    created: Date
    ends: Date
}

export type ErrorCodes = "NOT_FOUND" | "CONFLICT"
export class Rejection<T> {
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

export const notFound = <T>(who: string, state: T) => (console.log(`${who} not found`, state), new Rejection("NOT_FOUND", `${who} not found`, state));
export const conflict = <T>(who: string, state: T) => (console.log(`${who} already exists`, state), new Rejection("CONFLICT", `${who} already exists`, state));

export const customersReducer: Reducer<Customer[]> = (state: Customer[]) => ({
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

export const contractReducer: Reducer<Contract[]> = (state: Contract[]) => ({
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

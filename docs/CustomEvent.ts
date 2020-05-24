import { LitElement, html, customElement, property } from "lit-element";
import { useDispatcher, Reduce, useReducer, Dispatch } from "../";

const clickReducer = (state: number, payload: unknown) => ({
    add: () => state + (payload as number ?? 0)
})

@customElement("demo-clickme")
export class Clickable extends LitElement {
    reducer?: Reduce<number> = undefined

    @property({type: Number})
    startWith = 0

    connectedCallback() {
        super.connectedCallback();
        this.reducer = useReducer<number>(this, clickReducer, this.startWith, { dispatchEvent: true })
    }

    render() {
        if (!this.reducer) return html`<slot></slot>`

        const {publish} = this.reducer;

        return html`
            <button @click="${() => publish("add", 1)}">Increment</button>
            <slot></slot>
        `
    }
}

@customElement("demo-parent")
export class DemoParent extends LitElement {
    dispatcher: Dispatch<number>

    constructor() {
        super()
        this.dispatcher = useDispatcher(this, 0)
    }

    render() {
        const {publish, getState} = this.dispatcher
        return html`
            <demo-clickme startWith="0" @add="${(e: CustomEvent) => publish(e.detail.state)}">
                Clicked ${getState()} times
            </demo-clickme>
        `
    }
}
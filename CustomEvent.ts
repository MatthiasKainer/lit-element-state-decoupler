import { LitElement, html, customElement, property } from "lit-element";
import { useReducer, useDispatcher } from "lit-element-state-decoupler";

const clickReducer = (state: number) => ({
    add: (payload: number) => state + (payload as number ?? 0)
})

@customElement("demo-clickme")
export class Clickable extends LitElement {
    @property({type: Number})
    startWith = 0

    render() {
        const {publish} = useReducer<number>(this, clickReducer, this.startWith, { dispatchEvent: true })

        return html`
            <button @click="${() => publish("add", 1)}">Increment</button>
            <slot></slot>
        `
    }
}

@customElement("demo-parent")
export class DemoParent extends LitElement {
    render() {
        const {publish, getState} = useDispatcher(this, 0)
        return html`
            <demo-clickme startWith="0" @add="${(e: CustomEvent<number>) => publish(e.detail)}">
                Clicked ${getState()} times
            </demo-clickme>
        `
    }
}
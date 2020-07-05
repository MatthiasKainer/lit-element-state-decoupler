import { html } from "lit-element";
import { useReducer, useState } from "lit-element-state-decoupler";
import { pureLit } from "pure-lit";
import { LitElementWithProps } from "pure-lit/dist/types";

const clickReducer = (state: number) => ({
    add: (payload: number) => state + (payload as number ?? 0)
})

type ClickackableProps = {startWith: number}

pureLit("demo-clickme", (element: LitElementWithProps<ClickackableProps>) => {
    const {publish} = useReducer<number>(element, clickReducer, element.startWith, { dispatchEvent: true })

    return html`
        <button @click="${() => publish("add", 1)}">Increment</button>
        <slot></slot>
    `
}, { defaults: {startWith: 0}})

pureLit("demo-parent", (element) => {
    const {publish, getState} = useState(element, 0)
    return html`
        <demo-clickme .startWith=${0} @add="${(e: CustomEvent<number>) => publish(e.detail)}">
            Clicked ${getState()} times
        </demo-clickme>
    `
})
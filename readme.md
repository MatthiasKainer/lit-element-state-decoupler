# lit-element-state-decoupler

![Version](https://img.shields.io/npm/v/lit-element-state-decoupler?style=for-the-badge)
![Size](https://img.shields.io/bundlephobia/minzip/lit-element-state-decoupler?style=for-the-badge)
![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/lit-element-state-decoupler?style=for-the-badge)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge)
![Statements](badges/badge-statements.svg)
![Branch](badges/badge-branches.svg)
![Functions](badges/badge-functions.svg)
![Lines](badges/badge-lines.svg)

A lightweight utility for state handling outside of the component for [lit-elements](https://lit-element.polymer-project.org/)

## Install

`npm install lit-element-state-decoupler`

## Usage

You have two methods to choose from, `useDispatcher` and `useReducer`.

The dispatcher is a simple way to create a stateful object, the reducer allows you to create a handler for multiple actions.

## Example

See the following page for two simple todo-list examples using the `useDispatcher` and the `useReducer` functions:

[https://matthiaskainer.github.io/lit-element-state-decoupler/](https://matthiaskainer.github.io/lit-element-state-decoupler/)

### Dispatcher

Getting access to the dispatcher can be done by calling the `useDispatcher` function.

This should be done on one location in the lifecycle, and not inside a loop with a changing number of iterations because it tries to re-resolve the correct element from the previous run.

```ts
render() {
    const {getState, publish, subscribe} = useDispatcher<YourState>(this, defaultState)
}
```

The dispatcher exposes three functions, `getState`, `publish` and `subscribe`, and takes in a reference to the current LitElement and a default state. Whenever the state is updated, the LitElement will be updated, and the `render()` method of the component will be called.

```ts
render() {
    const {publish, getState} = useDispatcher<StateExample>(this, { values: [] })
    return html`
        <button @click="${() => publish([...getState(), "lala"])}">Add value</button>
        <textarea>${getState().values.join(",")}</textarea>
    `
}

```

| function | description |
|-|-|
| getState() => YourState | Returns the current state |
| publish(newState: YourState) => void | Updates the state to a new state |
| subscribe(yourSubscriberFunction) => void | Notifies subscribed functions if the state has been changed |

### Reducer

Getting access to the reducer can be done by calling the `useReducer` function.

This should be done on one location in the lifecycle, and not inside a loop with a changing number of iterations because it tries to re-resolve the correct element from the previous run.

```ts
render() {
    const {getState, publish, subscribe} = useReducer<YourState>(this, yourReducer, defaultState, options?)
}
```

Similar to the dispatcher, the reducer exposes three functions, `getState`, `publish` and `subscribe`, and takes in a reference to the current LitElement and a default state. In addition, it also requires a reducer function and can directly trigger custom events that bubble up and can be used by the parent.

Whenever the state is updated, the LitElement will be updated, and the `render()` method of the component will be called.

#### Reducer Function

The reducer follows a definition of `(state: T, payload: unknown) => {[action: string]: () => T}`, so it's a function that returns a map of actions that are triggered by a specific action. Other then in `redux`, no default action has to be provided. If the action does not exist, it falls back to returning the current state.

An example implementation of a reducer is thus:

```ts
class StateExample { constructor(public values = []) {} }

const exampleReducer = (state: StateExample) => ({
    add: (payload: string) => ({...state, value: [...state.values, payload]}),
    empty: () => ({...state, value: []})
})
```

#### Options

| variable | description |
|-|-|
| `dispatchEvent: boolean` (default: false) | If set to true, dispatches a action as custom event from the component |

#### Publish

The reducer can be triggered whenever the reducer's `publish` function is triggered, i.e.

```ts
render() {
    const {publish, getState} = useReducer<StateExample>(this, exampleReducer, { values: [] });
    return html`
        <button @click="${() => publish("add", "lala")}">Add value</button>
        <button @click="${() => publish("empty")}">Clean</button>
        <textarea>${getState().values.join(",")}</textarea>
    `
}
```

#### Publish with custom events

If specified in the options, the publish will also be dispatched as a custom event. An example would look like this:

```ts
class StateExample { constructor(public values = []) {} }

const exampleReducer = (state: StateExample) => ({
    add: (payload) => ({...state, value: [...state.values, payload]})
})

@customElement("demo-clickme")
class ClickableComponent extends LitElement {
    render() {
        const {publish, getState}
            = useReducer<StateExample>(this, exampleReducer, 0, { dispatchEvent: true })

        return html`
            <button @click="${() => publish("add", 1)}">Clicked ${getState()} times</button>
        `
    }
}

// usage
html`
<demo-clickme @add="${(e: CustomEvent<StateExample>) => console.log(e.detail)}">
</demo-clickme>
`

```

#### Subscribe to published events

For side effects it might be interesting for you to listen to your own dispatched events. This can be done via `subscribe`.

Usage:

```ts
const {publish, getState, subscribe} = useReducer<StateExample>(this, exampleReducer, 0)

subscribe((action, state) => console.log("Action triggered:", action, "State:", state))

return html`
    <button @click="${() => publish("add", 1)}">Clicked ${getState()} times</button>
`
```

In case you want to listen to a single action you can use the convenience method `when`.

```ts
const {publish, getState, when} = useReducer<StateExample>(this, exampleReducer, 0)

when("add", (state) => console.log("Add triggered! State:", state))

return html`
    <button @hover="${() => publish("highlight")}" @click="${() => publish("add", 1)}">Clicked ${getState()} times</button>
`
```

#### Arguments

| function | description |
|-|-|
| getState() => YourState | Returns the current state |
| publish(action: string, payload: unknown) => void | Triggers the defined `action` on your reducer, passing the payload |
| subscribe(yourSubscriberFunction) => void | Notifies subscribed functions when the state has been changed |
| when(action, yourSubscriberFunction) => void | Notifies subscribed functions when the action has been triggered |

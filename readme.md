# lit-element-state-decoupler

[![Version](https://img.shields.io/npm/v/lit-element-state-decoupler?style=for-the-badge)](https://www.npmjs.com/package/lit-element-state-decoupler)
[![Size](https://img.shields.io/bundlephobia/minzip/lit-element-state-decoupler?style=for-the-badge)](https://bundlephobia.com/result?p=lit-element-state-decoupler)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/lit-element-state-decoupler?style=for-the-badge)](https://snyk.io/test/github/MatthiasKainer/lit-element-state-decoupler?targetFile=package.json)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge)](https://bundlephobia.com/result?p=lit-element-state-decoupler)
[![code quality](https://img.shields.io/codeclimate/maintainability/MatthiasKainer/lit-element-state-decoupler?style=for-the-badge)](https://codeclimate.com/github/MatthiasKainer/lit-element-state-decoupler)
![Statements](badges/badge-statements.svg)
![Branch](badges/badge-branches.svg)
![Functions](badges/badge-functions.svg)
![Lines](badges/badge-lines.svg)

A lightweight utility for state handling outside of the component for [lit-elements](https://lit-element.polymer-project.org/)

## Install

`npm install lit-element-state-decoupler`

## Usage

You have two methods to choose from, `useState` and `useReducer`.

The state is a simple way to create a stateful object, the reducer allows you to create a handler for multiple actions.

Note that you need a lit-element version that comes with the `requestUpdate()` function for this library to work.

## Example

See the following page for two simple todo-list examples using the `useState` and the `useReducer` functions:

[https://matthiaskainer.github.io/lit-element-state-decoupler/](https://matthiaskainer.github.io/lit-element-state-decoupler/)

### State

Getting access to the state can be done by calling the `useState` function.

This should be done on one location in the lifecycle, and not inside a loop with a changing number of iterations because it tries to re-resolve the correct element from the previous run.

```ts
render() {
    const {getState, publish, subscribe} = useState<YourState>(this, defaultState)
}
```

The state exposes three functions, `getState`, `publish` and `subscribe`, and takes in a reference to the current LitElement and a default state. Whenever the state is updated, the LitElement will be updated, and the `render()` method of the component will be called.

```ts
render() {
    const {publish, getState} = useState<StateExample>(this, { values: [] })
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

Similar to the state, the reducer exposes three functions, `getState`, `publish` and `subscribe`, and takes in a reference to the current LitElement and a default state. In addition, it also requires a reducer function and can directly trigger custom events that bubble up and can be used by the parent.

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

## Avoiding endless state updates

Imaging a scenario where you need get some information from an endpoint you'd would want to store in the state. So you fetch it, and publish it. An example would look like this:

```ts
render() {
    const {getState, publish} =
        useReducer<Notifications>(this, NotificationReducer, { status: "Loading" })
    fetch("/api/notifications")
        .then(response => response.json())
        .then(data => publish("loaded", data))
        .catch(err => publish("failed", err))

    const { status, notifications } = getState()
    switch(status) {
        case "Error": return html`An error has occured`;
        case "Success": return html`<notification-table .notifications="${notifications}"></notification-table>`
    }
    return html`Please wait while loading`;
}
```

Unfortunately, this will lead to an endless loop. The reason is the following flow:

```txt
+--------------------------------+
|                                |
+-->render -> fetch -> publish+--+
```

The render triggers the fetch, which triggers a publish. A publish however triggers a render, which triggers a fetch, which triggers a publish. This triggers a render, which triggers a fetch, which triggers a publish. All of that forever, and really fast.

While deploying this is great to performance test your apis, and might not be the original plan. To work around this, you might want to use the library [lit-element-effect](https://github.com/MatthiasKainer/lit-element-effect/) which allows you to execute a certain callback only once, or if something changes.

Install it via `npm install lit-element-effect` and change your code as follows:

```ts
render() {
    const {getState, publish} =
        useReducer<Notifications>(this, NotificationReducer, { status: "Loading" })
    useOnce(this, () => {
        fetch("/api/notifications")
            .then(response => response.json())
            .then(data => publish("loaded", data))
            .catch(err => publish("failed", err))
    })

    const { status, notifications } = getState()
    switch(status) {
        case "Error": return html`An error has occured`;
        case "Success": return html`<notification-table .notifications="${notifications}"></notification-table>`
    }
    return html`Please wait while loading`;
}
```

With this little addition it is ensured that the fetch will be called only once. Accordingly, if you want to call the fetch on a property change only, use the `useEffect` hook as follows:

```ts
@property()
user: string

render() {
    const {getState, publish} =
        useReducer<Notifications>(this, NotificationReducer, { status: "Loading" })
    useEffect(this, () => {
        fetch(`/api/notifications/${this.user}`)
            .then(response => response.json())
            .then(data => publish("loaded", data))
            .catch(err => publish("failed", err))
    }, [this.user])

    const { status, notifications } = getState()
    switch(status) {
        case "Error": return html`An error has occured`;
        case "Success": return html`<notification-table .notifications="${notifications}"></notification-table>`
    }
    return html`Please wait while loading`;
}
```

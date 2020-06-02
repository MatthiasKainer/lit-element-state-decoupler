# lit-element-state-decoupler

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

This should be done only once, so usually you want to do it in the constructor of your component.

```ts
constructor() {
    super()
    const {getState, publish, subscribe} = useDispatcher<YourState>(this, defaultState)
}
```

The dispatcher exposes three functions, `getState`, `publish` and `subscribe`, and takes in a reference to the current LitElement and a default state. Whenever the state is updated, the LitElement will be updated, and the `render()` method of the component will be called.

```ts
constructor() {
    super()
    this.reducer = useDispatcher<StateExample>(this, { values: [] })
}

render() {
    const {publish, getState} = this.reducer;
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

This should be done only once, so usually you want to do it in the constructor of your component.

```ts
constructor() {
    super()
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

const exampleReducer = (state: StateExample, payload) => ({
    add: () => ({...state, value: [...state.values, payload]}),
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
constructor() {
    super()
    this.reducer = useReducer<StateExample>(this, exampleReducer, { values: [] })
}

render() {
    const {publish, getState} = this.reducer;
    return html`
        <button @click="${() => publish("add", "lala")}">Add value</button>
        <textarea>${getState().values.join(",")}</textarea>
    `
}

```

#### Publish with custom events

If specified in the options, the publish will also be dispatched as a custom event. An example would look like this:

```ts
class StateExample { constructor(public values = []) {} }

const exampleReducer = (state: StateExample, payload) => ({
    add: () => ({...state, value: [...state.values, payload]}),
    empty: () => ({...state, value: []})
})

@customElement("demo-clickme")
class ClickableComponent extends LitElement {
    constructor() {
        super()
        this.reducer = useReducer<StateExample>(this, exampleReducer, 0, { dispatchEvent: true })
    }

    render() {
        const {publish, getState} = this.reducer;

        return html`
            <button @click="${() => publish("add", 1)}">Clicked ${getState()} times</button>
        `
    }
}

// usage
html`
<demo-clickme @add="${(e: CustomEvent) => console.log(e.detail.state)}">
</demo-clickme>
`

```

#### Arguments

| function | description |
|-|-|
| getState() => YourState | Returns the current state |
| publish(action: string, payload: unknown) => void | Triggers the defined `action` on your reducer, passing the payload |
| subscribe(yourSubscriberFunction) => void | Notifies subscribed functions when the state has been changed |

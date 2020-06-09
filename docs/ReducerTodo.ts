import { LitElement, customElement, html } from "lit-element";
import { Reducer, useReducer } from "lit-element-state-decoupler";

import "./TodoBase";

interface TodoState {
  todos: string[];
}

const TodoReducer: Reducer<TodoState> = (state, payload) => ({
  add: () => ({ ...state, todos: [...state.todos, payload as string] }),
  remove: () => ({
    ...state,
    todos: [...state.todos.filter((todo) => todo !== payload)],
  })
})

@customElement("reducer-todo")
export class Todo extends LitElement {
  render() {
    const { publish, getState } = useReducer(this, TodoReducer, { todos: [] } as TodoState);
    return html`
      <h2>Your todos</h2>
      <todo-add
        @add="${(e: CustomEvent) =>
          publish("add", e.detail)
        }"
      ></todo-add>
      <todo-list
        .items="${getState().todos}"
        @remove="${(e: CustomEvent) =>
          publish("remove", e.detail)
        }"
      ></todo-list>
    `;
  }
}

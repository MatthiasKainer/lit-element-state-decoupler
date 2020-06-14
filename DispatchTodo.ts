import { LitElement, customElement, html } from "lit-element";
import { useState } from "lit-element-state-decoupler";

import "./TodoBase";

interface TodoState {
  todos: string[];
}

@customElement("dispatch-todo")
export class Todo extends LitElement {
  render() {
    const { publish, getState } = useState(this, { todos: [] } as TodoState);
    return html`
      <h2>Your todos</h2>
      <todo-add
        @add="${(e: CustomEvent) =>
          publish({ todos: [...getState().todos, e.detail] })}"
      ></todo-add>
      <todo-list
        .items="${getState().todos}"
        @remove="${(e: CustomEvent) =>
          publish({
            todos: [...getState().todos.filter((todo) => todo !== e.detail)],
          })}
        }"
      ></todo-list>
    `;
  }
}

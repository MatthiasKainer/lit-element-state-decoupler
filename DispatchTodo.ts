import { html } from "lit-element";
import { useState } from "lit-element-state-decoupler";

import "./TodoBase";
import { pureLit } from "pure-lit";

interface TodoState {
  todos: string[];
}

pureLit("dispatch-todo", (element) => {
  const { publish, getState } = useState(element, { todos: [] } as TodoState);
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
});

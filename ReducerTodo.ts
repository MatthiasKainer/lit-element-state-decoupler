import { html } from "lit-element";
import { Reducer, useReducer } from "lit-element-state-decoupler";

import "./TodoBase";
import { pureLit } from "pure-lit";

interface TodoState {
  todos: string[];
}

const TodoReducer: Reducer<TodoState> = (state) => ({
  add: (payload: string) => ({ ...state, todos: [...state.todos, payload as string] }),
  remove: (payload: string) => ({
    ...state,
    todos: [...state.todos.filter((todo) => todo !== payload)],
  })
})

pureLit("reducer-todo", (element) => {
    const { publish, getState } = useReducer(element, TodoReducer, { todos: [] } as TodoState);
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
)

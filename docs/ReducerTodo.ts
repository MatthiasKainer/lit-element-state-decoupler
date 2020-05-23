import { LitElement, customElement, html } from "lit-element";
import { useReducer, Reducer, Reduce } from "lit-element-state-decoupler";

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
  constructor(private todo: Reduce<TodoState>) {
    super();
    this.todo = useReducer(this, TodoReducer, { todos: [] } as TodoState);
  }

  render() {
    const { publish, getState } = this.todo;
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

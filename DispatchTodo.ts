import { LitElement, customElement, html } from "lit-element";
import { useDispatcher, Dispatch } from "lit-element-state-decoupler";

import "./TodoBase";

interface TodoState {
  todos: string[];
}

@customElement("dispatch-todo")
export class Todo extends LitElement {
  constructor(private todo: Dispatch<TodoState>) {
    super();
    this.todo = useDispatcher(this, { todos: [] } as TodoState);
  }

  render() {
    const { publish, getState } = this.todo;
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

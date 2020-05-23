import { LitElement, customElement, property, html, css } from "lit-element";
import { useDispatcher, Dispatch } from "lit-element-state-decoupler";

const blockElement = css`
    :host {
        display:block;
    }
`

@customElement("todo-list")
export class TodoList extends LitElement {
  @property({ type: Array })
  items: string[] = [];

  static get styles() { return [blockElement] }

  render() {
    return html`<ul>
      ${this.items.map((item) => html`<li @click="${() => this.dispatchEvent(new CustomEvent("remove", {detail: item}))}">${item}</li>`)}
    </ul>`;
  }
}

interface AddTodoState { value: string }

@customElement("todo-add")
export class AddTodo extends LitElement {
  constructor(private todo: Dispatch<AddTodoState>) {
    super();
    this.todo = useDispatcher(this, {value: ""});
  }

  static get styles() { return [blockElement] }

  render() {
    const { getState, publish } = this.todo;
    return html`
      <input
        type="text"
        name="item"
        value="${getState().value}"
        @input="${(e: InputEvent) =>
          publish({value: (e.target as HTMLInputElement)?.value})}"
        placeholder="insert new item"
      />
      <button
        @click=${() =>
          this.dispatchEvent(new CustomEvent("add", { detail: getState().value }))}
      >
        Add Event
      </button>
    `;
  }
}

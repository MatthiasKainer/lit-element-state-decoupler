import { LitElement, customElement, property, html } from "lit-element";
import { useDispatcher, Dispatch } from "litelement-state-decoupler";

type DemoElementState = {
  actions: string[];
};

@customElement("action-list")
export class ActionList extends LitElement {
  @property({ type: Array })
  actions: string[] = [];

  render() {
    return html`<ul>
      ${this.actions.map((action) => html`<li>${action}</li>`)}
    </ul>`;
  }
}

@customElement("trigger-button")
export class TriggerButton extends LitElement {
  @property()
  name: string = "";

  _onClick() {
    this.dispatchEvent(new CustomEvent("trigger", { detail: `Button "${this.name}" was clicked` }));
  }

  render() {
    return html`<button @click="${() => this._onClick()}">
      ${this.name}
    </button>`;
  }
}

type CheckableInputElement = {
    target: HTMLInputElement
}

@customElement("demo-element")
export class DemoElement extends LitElement {
  state: Dispatch<DemoElementState>;

  constructor() {
    super()
    // register dispatcher in the constructor
    this.state = useDispatcher<DemoElementState>(this, { actions: [] })
  }

  render() {
    // get the current state for each rendering
    const { actions } = this.state.getState()
    // Change the state from multiple different actions using the publish function
    const { publish } = this.state
    return html` <div>
        <trigger-button name="Button1"
          @trigger="${(e: CustomEvent) => publish({ actions: [...actions, e.detail] })}"
        ></trigger-button>
        <trigger-button name="Button2"
          @trigger="${(e: CustomEvent) => publish({ actions: [...actions, e.detail] })}"
        ></trigger-button>
        <input
          type="checkbox"
          @change="${({ target }: CheckableInputElement) => publish({ actions: [...actions, `Element checked: ${target.checked}`] })}"
        />
      </div>
      <action-list .actions="${actions}"></action-list>`
  }
}

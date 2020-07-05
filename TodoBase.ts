import { html, css } from "lit-element";
import { useState } from "lit-element-state-decoupler";
import { pureLit } from "pure-lit";
import { LitElementWithProps } from "pure-lit/dist/types";

const blockElement = css`
  :host {
    display: block;
  }
`;

type ListProps = { items: string[] };

pureLit(
  "todo-list",
  (element: LitElementWithProps<ListProps>) => html`<ul>
    ${element.items.map(
      (item) =>
        html`<li
          @click="${() =>
            element.dispatchEvent(new CustomEvent("remove", { detail: item }))}"
        >
          ${item}
        </li>`
    )}
  </ul>`,
  {
    styles: [blockElement],
    defaults: { items: [] },
  }
);

pureLit(
  "todo-add",
  (element) => {
    const { getState, publish } = useState(element, { value: "" });
    return html`
      <input
        type="text"
        name="item"
        value="${getState().value}"
        @input="${(e: InputEvent) =>
          publish({ value: (e.target as HTMLInputElement)?.value })}"
        placeholder="insert new item"
      />
      <button
        @click=${() =>
          element.dispatchEvent(
            new CustomEvent("add", { detail: getState().value })
          )}
      >
        Add Event
      </button>
    `;
  },
  {
    styles: [blockElement],
  }
);

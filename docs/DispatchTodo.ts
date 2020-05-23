import { LitElement, customElement } from "lit-element";
import { useDispatcher, Dispatch } from "litelement-state-decoupler";

interface TodoState {
    todos: []
}

@customElement("dispatch-todo")
export class Todo extends LitElement {
    constructor(public todo: Dispatch<TodoState>) {
        super()
        todo = useDispatcher(this, { todos: [] })
    }

    render() {
        
    }
}
import { decorate, withState, withReducer, asUpdateableLitElement, withWorkflow } from "./decorator";
import { LitLikeElement, DecoratedLitLikeElement, InjectableState, Reduce, Workflow } from "./types";

function createState() {
  return {
    set: jest.fn(),
    subscribe: jest.fn(),
    get: jest.fn(),
    inject: jest.fn(),
    value: jest.fn()
  } as any as InjectableState<string>;
}

function createReducer() {
  return {
    when: jest.fn(),
    set: jest.fn(),
    subscribe: jest.fn(),
    get: jest.fn(),
    dispatch: jest.fn()
  } as Reduce<string>;
}

function createWorkflow() {
  return {
    addActivity: jest.fn(),
    addCompensation: jest.fn(),
    addSideeffect: jest.fn(),
    projections: jest.fn(),
    history: jest.fn(),
    after: jest.fn(),
    compensate: jest.fn(),
    plan: jest.fn()
  } as Workflow;
}

describe("decorator", () => {
  let litElement: LitLikeElement;

  beforeEach(() => {
    jest.resetAllMocks();
    litElement = ({
      requestUpdate: jest.fn(),
      dispatchEvent: jest.fn(),
      updated: () => jest.fn(),
    } as unknown) as LitLikeElement;
  });

  it("failes for a element without required functions", () => {
    expect(() => decorate({} as LitLikeElement)).toThrowError("Element missing required functions (dispatchEvent/requestUpdate)")
  })

  it("decorates a litelement with a list for the states", () => {
    decorate(litElement);
    expect(
      (litElement as DecoratedLitLikeElement).__registered_states
    ).toBeDefined();
  });
  it("does not re-decorate a litelement if already decorated", () => {
    const decorated = decorate(litElement);
    decorated.__registered_states.index = 5;
    decorate(decorated);
    expect(
      (decorated as DecoratedLitLikeElement).__registered_states.index
    ).toBe(5);
  });

  describe("with states", () => {
    it("correctly adds the state to the decoration", () => {
      const state = createState();
      withState(litElement, state);
      expect((litElement as DecoratedLitLikeElement).__registered_states.states).toHaveLength(1);
      expect((litElement as DecoratedLitLikeElement).__registered_states.count).toBe(1);
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(1);
    });

    it("resets the states on updated, returning the first element again", () => {
      const state = createState();
      (state.get as jest.Mock).mockReturnValue("state 1")
      withState(litElement, state);
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(1);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(0);
      const secondState = createState();
      (secondState.get as jest.Mock).mockReturnValue("state 2")
      const resolvedState = withState(litElement, secondState);
      expect((litElement as DecoratedLitLikeElement).__registered_states.count).toBe(1);
      expect(state).toBe(resolvedState);
      expect(state.get()).toBe(resolvedState.get())
    });

    it("uses the new default state the states on updated if requested, still returning the first element", () => {
      const state = createState();
      (state.get as jest.Mock).mockReturnValue("state 1")
      withState(litElement, state);
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(1);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(0);
      const secondState = createState();
      (secondState.get as jest.Mock).mockReturnValue("state 2")
      const resolvedState = withState(litElement, secondState, { updateDefault: true });
      expect((litElement as DecoratedLitLikeElement).__registered_states.count).toBe(1);
      expect(state).toBe(resolvedState);
      expect(state.inject).toBeCalledWith(secondState.get())
    });

    it("resets the states on updated, returning the correct states on future calls", () => {
      const firstState = createState();
      const secondState = createState();
      const thirdState = createState();
      withState(litElement, firstState);
      withState(litElement, secondState);
      withState(litElement, thirdState);
      expect(
        (litElement as DecoratedLitLikeElement).__registered_states.index
      ).toBe(3);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(0);
      expect(firstState).toBe(withState(litElement, createState()));
      expect(secondState).toBe(withState(litElement, createState()));
      expect(thirdState).toBe(withState(litElement, createState()));
    });
  });

  describe("with reducers, which work only together with states", () => {
    beforeEach(() => {
        // reducers only exist as part of states, 
        //  which is why we always have to create one first
        withState(litElement, createState());
    })

    it("correctly adds the reducer when we are still adding elements", () => {
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers).toHaveLength(0)
        withReducer(litElement, createReducer());
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers).toHaveLength(1)
    })
    it("correctly adds the reducer at the right index when we are still adding elements", () => {
        withState(litElement, createState());
        withState(litElement, createState());
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers).toHaveLength(0)
        const currentReducer = withReducer(litElement, createReducer());
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers[0]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers[1]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers[2]).toBe(currentReducer)
        expect((litElement as DecoratedLitLikeElement).__registered_states.reducers).toHaveLength(3)
    })
    it("correctly gets the reducer after an update", () => {
        withState(litElement, createState());
        const middleReducer = withReducer(litElement, createReducer());
        withState(litElement, createState());
        const lastReducer = withReducer(litElement, createReducer());
        asUpdateableLitElement(litElement).updated();

        expect(withReducer(litElement, createReducer())).toBeUndefined()
        withState(litElement, createState());
        expect(withReducer(litElement, createReducer())).toBeUndefined()
        withState(litElement, createState());
        expect(withReducer(litElement, createReducer())).toBe(middleReducer)
        withState(litElement, createState());
        expect(withReducer(litElement, createReducer())).toBe(lastReducer)
    })
  })

  describe("with workflows, which work only together with states", () => {
    beforeEach(() => {
        // workflows only exist as part of states, 
        //  which is why we always have to create one first
        withState(litElement, createState());
    })

    it("correctly adds the workflow when we are still adding elements", () => {
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows).toHaveLength(0)
        withWorkflow(litElement, createWorkflow());
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows).toHaveLength(1)
    })
    it("correctly adds the workflow at the right index when we are still adding elements", () => {
        withState(litElement, createState());
        withState(litElement, createState());
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows).toHaveLength(0)
        const currentWorkflow = withWorkflow(litElement, createWorkflow());
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows[0]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows[1]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows[2]).toBe(currentWorkflow)
        expect((litElement as DecoratedLitLikeElement).__registered_states.workflows).toHaveLength(3)
    })
    it("correctly gets the workflow after an update", () => {
        withState(litElement, createState());
        const middleWorkflow = withWorkflow(litElement, createWorkflow());
        withState(litElement, createState());
        const lastWorkflow = withWorkflow(litElement, createWorkflow());
        asUpdateableLitElement(litElement).updated();

        expect(withWorkflow(litElement, createWorkflow())).toBeUndefined()
        withState(litElement, createState());
        expect(withWorkflow(litElement, createWorkflow())).toBeUndefined()
        withState(litElement, createState());
        expect(withWorkflow(litElement, createWorkflow())).toBe(middleWorkflow)
        withState(litElement, createState());
        expect(withWorkflow(litElement, createWorkflow())).toBe(lastWorkflow)
    })
  })
});

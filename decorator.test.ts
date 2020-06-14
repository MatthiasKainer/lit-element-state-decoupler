import { decorate, withState, withReducer, asUpdateableLitElement } from "./decorator";
import { LitLikeElement, DecoratedLitLikeElement, State, Reduce } from "./types";

function createState() {
  return {
    publish: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
  } as State<string>;
}

function createReducer() {
  return {
    when: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
  } as Reduce<string>;
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
    expect(() => decorate({} as LitLikeElement)).toThrowError("The lit-element is missing the required functions dispatchEvent or requestUpdate")
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
      withState(litElement, state);
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(1);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_states.index).toBe(0);
      const resolvedState = withState(litElement, createState());
      expect((litElement as DecoratedLitLikeElement).__registered_states.count).toBe(1);
      expect(state).toBe(resolvedState);
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
});

import { decorate, withDispatcher, withReducer, asUpdateableLitElement } from "./decorator";
import { LitLikeElement, DecoratedLitLikeElement, Dispatch, Reduce } from "./types";

function createDispatcher() {
  return {
    publish: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
  } as Dispatch<string>;
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
      updated: () => jest.fn(),
    } as unknown) as LitLikeElement;
  });

  it("decorates a litelement with a list for the dispatchers", () => {
    decorate(litElement);
    expect(
      (litElement as DecoratedLitLikeElement).__registered_dispatchers
    ).toBeDefined();
  });
  it("does not re-decorate a litelement if already decorated", () => {
    const decorated = decorate(litElement);
    decorated.__registered_dispatchers.index = 5;
    decorate(decorated);
    expect(
      (decorated as DecoratedLitLikeElement).__registered_dispatchers.index
    ).toBe(5);
  });

  describe("with dispatchers", () => {
    it("correctly adds the dispatcher to the decoration", () => {
      const dispatcher = createDispatcher();
      withDispatcher(litElement, dispatcher);
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.dispatchers).toHaveLength(1);
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.count).toBe(1);
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.index).toBe(1);
    });

    it("resets the dispatchers on updated, returning the first element again", () => {
      const dispatcher = createDispatcher();
      withDispatcher(litElement, dispatcher);
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.index).toBe(1);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.index).toBe(0);
      const resolvedDispatcher = withDispatcher(litElement, createDispatcher());
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.count).toBe(1);
      expect(dispatcher).toBe(resolvedDispatcher);
    });

    it("resets the dispatchers on updated, returning the correct dispatchers on future calls", () => {
      const firstDispatcher = createDispatcher();
      const secondDispatcher = createDispatcher();
      const thirdDispatcher = createDispatcher();
      withDispatcher(litElement, firstDispatcher);
      withDispatcher(litElement, secondDispatcher);
      withDispatcher(litElement, thirdDispatcher);
      expect(
        (litElement as DecoratedLitLikeElement).__registered_dispatchers.index
      ).toBe(3);

      asUpdateableLitElement(litElement).updated();
      expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.index).toBe(0);
      expect(firstDispatcher).toBe(withDispatcher(litElement, createDispatcher()));
      expect(secondDispatcher).toBe(withDispatcher(litElement, createDispatcher()));
      expect(thirdDispatcher).toBe(withDispatcher(litElement, createDispatcher()));
    });
  });

  describe("with reducers, which work only together with dispatchers", () => {
    beforeEach(() => {
        // reducers only exist as part of dispatchers, 
        //  which is why we always have to create one first
        withDispatcher(litElement, createDispatcher());
    })

    it("correctly adds the reducer when we are still adding elements", () => {
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers).toHaveLength(0)
        withReducer(litElement, createReducer());
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers).toHaveLength(1)
    })
    it("correctly adds the reducer at the right index when we are still adding elements", () => {
        withDispatcher(litElement, createDispatcher());
        withDispatcher(litElement, createDispatcher());
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers).toHaveLength(0)
        const currentReducer = withReducer(litElement, createReducer());
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers[0]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers[1]).toBeUndefined()
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers[2]).toBe(currentReducer)
        expect((litElement as DecoratedLitLikeElement).__registered_dispatchers.reducers).toHaveLength(3)
    })
    it("correctly gets the reducer after an update", () => {
        withDispatcher(litElement, createDispatcher());
        const middleReducer = withReducer(litElement, createReducer());
        withDispatcher(litElement, createDispatcher());
        const lastReducer = withReducer(litElement, createReducer());
        asUpdateableLitElement(litElement).updated();

        expect(withReducer(litElement, createReducer())).toBeUndefined()
        withDispatcher(litElement, createDispatcher());
        expect(withReducer(litElement, createReducer())).toBeUndefined()
        withDispatcher(litElement, createDispatcher());
        expect(withReducer(litElement, createReducer())).toBe(middleReducer)
        withDispatcher(litElement, createDispatcher());
        expect(withReducer(litElement, createReducer())).toBe(lastReducer)
    })
  })
});

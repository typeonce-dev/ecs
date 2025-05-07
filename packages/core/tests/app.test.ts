import { describe, expect, it } from "vitest";
import { App, Component, System } from "../src/index";

describe("App", () => {
  class Position extends Component.Component("Position")<{ x: number }> {}
  class Size extends Component.Component("Size")<{ value: number }> {}

  it("executes startup systems", () => {
    const update = App.empty<{ Test: { n: number } }>().pipe(
      App.setupSystem(
        System.make("Setup", ({ queue, deltaTime }) => {
          expect(deltaTime).toBe(0);
          // queue(
          //   Command.spawn(new Position({ x: 10 }), new Size({ value: 20 })),
          //   Command.spawn(new Position({ x: 10 }), new Size({ value: 20 }))
          // );
        })
      ),
      App.update
    );
  });

  it("executes update systems", () => {
    const update = App.empty<{ Test: { n: number } }>().pipe(
      App.updateSystem("Gameplay1", ({ queue, deltaTime }) => {
        expect(deltaTime).toBe(1);
      }),
      App.updateSystem("Gameplay2", ({ queue, deltaTime }) => {
        expect(deltaTime).toBe(1);
      }),
      App.update
    );

    update(1);
  });

  it("add resource", () => {
    const update = App.empty<{
      Test: { n: number };
      Test2: { s: string };
    }>().pipe(
      App.addResource("Test", { n: 10 }),
      App.addResource("Test2", { s: "test" }),
      App.updateSystem("Gameplay1", ({ queue, deltaTime, getResource }) => {
        expect(getResource("Test")).toStrictEqual({ n: 10 });
        expect(getResource("Test2")).toStrictEqual({ s: "test" });
      }),
      App.update
    );

    update(1);
  });
});

import { describe, expect, it } from "vitest";
import { Component, ECS, System } from "../src/ecs";

describe("Component", () => {
  it("creates a component class with correct properties and tag", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}
    class Speed extends Component("Position")<{
      dx: number;
      dy: number;
    }> {}

    const position = new Position({ x: 10, y: 20 });
    const asVoid = new AsVoid();
    const speed = new Speed({ dx: 1, dy: 2 });

    expect(position).toBeInstanceOf(Position);
    expect(asVoid).toBeInstanceOf(AsVoid);
    expect(speed).toBeInstanceOf(Speed);

    expect(position).toHaveProperty("x", 10);
    expect(position).toHaveProperty("y", 20);
    expect(asVoid).toHaveProperty("_tag", "AsVoid");
    expect(speed).toHaveProperty("dx", 1);
    expect(speed).toHaveProperty("dy", 2);
  });
});

describe("Systems", () => {
  it("create systems from system factory", () => {
    const SystemFactory = System<{}, "A">();

    class A extends SystemFactory<{
      a: number;
    }>("A", {
      dependencies: [],
      execute: ({ input: { a } }) => {
        expect(a).toBe(10);
      },
    }) {}

    const system = new A({ a: 10 });
    expect(system.a).toBe(10);
    const world = ECS.create(({ addSystem }) => {
      addSystem(system);
    });

    world.update(0);
  });

  it("executes systems based on dependencies", () => {
    const SystemFactory = System<{}, "A" | "B">();
    let bExecuted = false;

    class A extends SystemFactory<{
      a: number;
    }>("A", {
      dependencies: ["B"],
      execute: ({ input: { a } }) => {
        expect(bExecuted).toBe(true);
        expect(a).toBe(10);
      },
    }) {}

    class B extends SystemFactory<{
      b: string;
    }>("B", {
      dependencies: [],
      execute: ({ input: { b } }) => {
        bExecuted = true;
        expect(b).toBe("abc");
      },
    }) {}

    const a = new A({ a: 10 });
    const b = new B({ b: "abc" });
    expect(a.a).toBe(10);
    expect(b.b).toBe("abc");
    const world = ECS.create(({ addSystem }) => {
      addSystem(a, b);
    });

    world.update(0);
  });
});

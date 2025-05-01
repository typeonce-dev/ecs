import { describe, expect, it } from "vitest";
import { Component } from "../src/index";

describe("Component", () => {
  it("creates a component class with correct properties and tag", () => {
    class AsVoid extends Component.Component("AsVoid")<{}> {}
    class Position extends Component.Component("Position")<{
      x: number;
      y: number;
    }> {}
    class Speed extends Component.Component("Speed")<{
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

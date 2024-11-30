import { describe, expect, it } from "vitest";
import {
  addComponent,
  Component,
  createEntity,
  getComponentRequired,
  query,
  queryRequired,
} from "../src/ecs";
import { ECS } from "../src/world";

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

describe("getComponentRequired", () => {
  it("extracts the correct component from the world entity", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}

    const world = new ECS();
    const entity = createEntity()(world);
    const position = new Position({ x: 10, y: 20 });
    const asVoid = new AsVoid();

    addComponent(entity, position, asVoid)(world);

    const entityWithComponents = getComponentRequired(entity, {
      position: Position,
      asVoid: AsVoid,
    })(world);

    expect(entityWithComponents).toHaveProperty("entityId", entity);
    expect(entityWithComponents).toHaveProperty("position", position);
    expect(entityWithComponents).toHaveProperty("asVoid", asVoid);
    expect(entityWithComponents.position).toBeInstanceOf(Position);
    expect(entityWithComponents.asVoid).toBeInstanceOf(AsVoid);
    expect(entityWithComponents.position).toBe(position);
    expect(entityWithComponents.asVoid).toBe(asVoid);
    expect(entityWithComponents.position._tag).toBe("Position");
    expect(entityWithComponents.position.x).toBe(10);
    expect(entityWithComponents.position.y).toBe(20);
    expect(entityWithComponents.asVoid._tag).toBe("AsVoid");
  });
});

describe("queryRequired", () => {
  it("creates a function that expects the correct component from the world entity", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}

    const world = new ECS();
    const entity = createEntity()(world);
    const position = new Position({ x: 10, y: 20 });
    const asVoid = new AsVoid();

    addComponent(entity, position, asVoid)(world);

    const withComponent = queryRequired({
      position: Position,
      asVoid: AsVoid,
    })(world);

    const entityWithComponents = withComponent[0];

    expect(entityWithComponents).toHaveProperty("entityId", entity);
    expect(entityWithComponents).toHaveProperty("position", position);
    expect(entityWithComponents).toHaveProperty("asVoid", asVoid);
    expect(entityWithComponents.position).toBeInstanceOf(Position);
    expect(entityWithComponents.asVoid).toBeInstanceOf(AsVoid);
    expect(entityWithComponents.position).toBe(position);
    expect(entityWithComponents.asVoid).toBe(asVoid);
    expect(entityWithComponents.position._tag).toBe("Position");
    expect(entityWithComponents.position.x).toBe(10);
    expect(entityWithComponents.position.y).toBe(20);
    expect(entityWithComponents.asVoid._tag).toBe("AsVoid");
  });
});

describe("query", () => {
  it("returns an empty array if no entities match the query", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}

    const world = new ECS();
    const entity = createEntity()(world);
    const position = new Position({ x: 10, y: 20 });

    addComponent(entity, position)(world);

    const withComponentEmpty = query({
      position: Position,
      asVoid: AsVoid,
    })(world);

    const withComponentFound = query({
      position: Position,
    })(world);

    expect(withComponentEmpty).toHaveLength(0);
    expect(withComponentFound).toHaveLength(1);
  });
});
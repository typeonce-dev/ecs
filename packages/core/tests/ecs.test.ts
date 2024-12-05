import { describe, expect, it } from "vitest";
import { Component, ECS, query, System } from "../src/ecs";

describe("Component", () => {
  it("creates a component class with correct properties and tag", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}
    class Speed extends Component("Speed")<{
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

  it("can emit and access events", () => {
    const event = Symbol("event");
    const SystemFactory = System<{ [event]: number }, "A" | "B">();

    class A extends SystemFactory<{}>("A", {
      execute: ({ emit }) => {
        emit({ type: event, data: 10 });
      },
    }) {}

    class B extends SystemFactory<{}>("B", {
      dependencies: ["A"],
      execute: ({ poll }) => {
        const events = poll(event);
        expect(events).toHaveLength(1);
        events.forEach((event) => {
          expect(event.data).toBe(10);
        });
      },
    }) {}

    const a = new A();
    const b = new B();
    const world = ECS.create(({ addSystem }) => {
      addSystem(a, b);
    });

    world.update(0);
  });

  it("mutations are applied at the end of the update", () => {
    class AsVoid extends Component("AsVoid")<{}> {}
    const SystemFactory = System<{}, "A" | "B">();

    class A extends SystemFactory<{}>("A", {
      execute: ({ addComponent, createEntity }) => {
        addComponent(createEntity(), new AsVoid());
      },
    }) {}

    class B extends SystemFactory<{}>("B", {
      dependencies: ["A"],
      execute: ({ world }) => {
        const entities = query({ asVoid: AsVoid })(world);
        expect(entities).toHaveLength(0);
      },
    }) {}

    const a = new A();
    const b = new B();
    const world = ECS.create(({ addSystem }) => {
      addSystem(a, b);
    });

    world.update(0);
  });

  it("components updates are applied the end of the update (last update wins)", () => {
    class AsValue extends Component("AsValue")<{ value: number }> {}
    const SystemFactory = System<{}, "A" | "B">();
    let isFirstUpdate = true;

    const withValues = query({ asValue: AsValue });
    class A extends SystemFactory<{}>("A", {
      execute: ({ setComponent }) => {
        withValues(world).forEach(({ entityId, asValue }) => {
          if (isFirstUpdate) {
            expect(asValue.value).toBe(10);
          } else {
            expect(asValue.value).toBe(30);
          }
          setComponent(entityId, new AsValue({ value: 20 }));
        });
      },
    }) {}

    class B extends SystemFactory<{}>("B", {
      dependencies: ["A"],
      execute: ({ setComponent }) => {
        withValues(world).forEach(({ entityId, asValue }) => {
          if (isFirstUpdate) {
            expect(asValue.value).toBe(10);
          } else {
            expect(asValue.value).toBe(30);
          }
          setComponent(entityId, new AsValue({ value: 30 }));
        });
      },
    }) {}

    const a = new A();
    const b = new B();
    const world = ECS.create(({ addSystem, addComponent, createEntity }) => {
      addSystem(a, b);
      addComponent(createEntity(), new AsValue({ value: 10 }));
    });

    world.update(0);
    isFirstUpdate = false;
    world.update(0);
  });

  it("can use setComponent to a new entity", () => {
    class AsValue extends Component("AsValue")<{ value: number }> {}
    const SystemFactory = System<{}, "A" | "B">();
    let isFirstUpdate = true;

    const withValues = query({ asValue: AsValue });
    class A extends SystemFactory<{}>("A", {
      execute: ({ setComponent, createEntity }) => {
        setComponent(createEntity(), new AsValue({ value: 20 }));
      },
    }) {}

    class B extends SystemFactory<{}>("B", {
      dependencies: ["A"],
      execute: ({ world }) => {
        const entities = withValues(world);
        if (isFirstUpdate) {
          expect(entities.length).toBe(0);
        } else {
          expect(entities.length).toBe(1);
        }
      },
    }) {}

    const a = new A();
    const b = new B();
    const world = ECS.create(({ addSystem, addComponent, createEntity }) => {
      addSystem(a, b);
    });

    world.update(0);
    isFirstUpdate = false;
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

  it("can handle multiple dependencies", () => {
    const SystemFactory = System<{}, "A" | "B" | "C">();
    let bExecuted = false;
    let cExecuted = false;

    class A extends SystemFactory<{
      a: number;
    }>("A", {
      dependencies: ["B", "C"],
      execute: ({ input: { a } }) => {
        expect(bExecuted).toBe(true);
        expect(cExecuted).toBe(true);
        expect(a).toBe(10);
      },
    }) {}

    class B extends SystemFactory<{
      b: string;
    }>("B", {
      execute: ({ input: { b } }) => {
        bExecuted = true;
        expect(b).toBe("abc");
      },
    }) {}

    class C extends SystemFactory<{
      b: boolean;
    }>("C", {
      execute: ({ input: { b } }) => {
        cExecuted = true;
        expect(b).toBe(true);
      },
    }) {}

    const a = new A({ a: 10 });
    const b = new B({ b: "abc" });
    const c = new C({ b: true });
    expect(a.a).toBe(10);
    expect(b.b).toBe("abc");
    expect(c.b).toBe(true);
    const world = ECS.create(({ addSystem }) => {
      addSystem(a, b, c);
    });

    world.update(0);
  });
});

describe("Queries", () => {
  it("can query based on multiple components", () => {
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}
    class Speed extends Component("Speed")<{
      dx: number;
      dy: number;
    }> {}

    const testQuery = query({ position: Position, speed: Speed });

    const SystemFactory = System<{}, "A">();

    class A extends SystemFactory<{}>("A", {
      execute: () => {
        const entities = testQuery(world);
        expect(entities).toHaveLength(1);
        expect(entities[0].position.x).toBe(10);
        expect(entities[0].position.y).toBe(20);
        expect(entities[0].speed.dy).toBe(2);
        expect(entities[0].speed.dx).toBe(1);
      },
    }) {}

    const world = ECS.create(({ addComponent, createEntity, addSystem }) => {
      addComponent(
        createEntity(),
        new Position({ x: 10, y: 20 }),
        new Speed({ dx: 1, dy: 2 })
      );

      addSystem(new A());
    });

    world.update(0);
  });

  it("can query entities that don't have a component", () => {
    class Position extends Component("Position")<{
      x: number;
      y: number;
    }> {}
    class Speed extends Component("Speed")<{
      dx: number;
      dy: number;
    }> {}

    const testQuery = query({ speed: Speed }, [Position]);

    const SystemFactory = System<{}, "A">();

    class A extends SystemFactory<{}>("A", {
      execute: () => {
        const entities = testQuery(world);
        expect(entities).toHaveLength(1);
        expect(entities[0].speed.dy).toBe(2);
        expect(entities[0].speed.dx).toBe(1);
      },
    }) {}

    const world = ECS.create(({ addComponent, createEntity, addSystem }) => {
      addComponent(
        createEntity(),
        new Position({ x: 10, y: 20 }),
        new Speed({ dx: -1, dy: -1 })
      );

      addComponent(createEntity(), new Speed({ dx: 1, dy: 2 }));

      addSystem(new A());
    });

    world.update(0);
  });
});

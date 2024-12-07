# `@typeonce/ecs`
An **Entity Component System** (ECS) implementation in TypeScript, extensible, working with any renderer, type safe and composable 🕹️

> `@typeonce/ecs` has zero dependencies. It makes no assumptions about your game engine, renderer or any other library or framework.

It is designed to provide a **solid and type-safe ECS implementation** to keep the logic of your game organized and easy to understand.

How you choose to render, apply physics, manage input, etc. is up to you, `@typeonce/ecs` **doesn't impose any constraints**.

### Quick start
Install the package:

```bash
pnpm add @typeonce/ecs
```

Define your components (e.g. `components.ts`):

```ts
import { Component } from "@typeonce/ecs";

export class Position extends Component<"Position"><{
  x: number;
  y: number;
}> {}

export class Velocity extends Component<"Velocity"><{
  dx: number;
  dy: number;
}> {}
```

Define your systems (e.g. `systems.ts`):

```ts
import { System } from "@typeonce/ecs";

export type SystemTags = "Movement";
const SystemFactory = System<SystemTags>();

export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world }) => {
    // Implement the system logic
  },
}) {}
```

Write the system logic by querying entities that have a set of components attached:

```ts
import { query, System } from "@typeonce/ecs";
import { Position, Velocity } from "./components";

const moving = query({ position: Position, velocity: Velocity });

export type SystemTags = "Movement";
const SystemFactory = System<SystemTags>();

export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world }) => {
    moving(world).forEach(({ position, velocity }) => {
      // Do something with each entity and its `position` and `velocity` components
    });
  },
}) {}
```

Update the components to apply changes to the game (e.g. movement):

```ts
import { query, System } from "@typeonce/ecs";
import { Position, Velocity } from "./components";

const moving = query({ position: Position, velocity: Velocity });

export type SystemTags = "Movement";
const SystemFactory = System<SystemTags>();

export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world, deltaTime }) => {
    moving(world).forEach(({ position, velocity }) => {
      position.x += velocity.dx * deltaTime;
      position.y += velocity.dy * deltaTime;
    });
  },
}) {}
```

Create an instance of the game using `ECS.create`:  

```ts
import { ECS } from "@typeonce/ecs";
import { type SystemTags } from "./systems";

const world = ECS.create<SystemTags>(() => {
  // Initialize the game
});
```

Initialize entities, components and systems inside `ECS.create`:

```ts
import { ECS } from "@typeonce/ecs";
import { MovementSystem, RenderSystem, type SystemTags } from "./systems";
import { Position, Velocity } from "./components";

const world = ECS.create<SystemTags>(
  ({ addComponent, createEntity, addSystem }) => {
    addComponent(
      createEntity(),
      new Position({ x: 0, y: 0 }),
      new Velocity({ dx: 0, dy: 0 })
    );

    addSystem(
      new MovementSystem(),
      new RenderSystem()
    );
  }
);
```

Run the game loop by executing the `update` function from `ECS`:

> You can use `requestAnimationFrame`, `setInterval`, or any other renderer to run the game loop (libraries or frameworks like `pixi.js`, Phaser, etc.)

```ts
import { ECS } from "@typeonce/ecs";
import { MovementSystem, RenderSystem, type SystemTags } from "./systems";
import { Position, Velocity } from "./components";

const world = ECS.create<SystemTags>(
  ({ addComponent, createEntity, addSystem }) => {
    addComponent(
      createEntity(),
      new Position({ x: 0, y: 0 }),
      new Velocity({ dx: 0, dy: 0 })
    );

    addSystem(
      new MovementSystem(),
      new RenderSystem()
    );
  }
);

requestAnimationFrame((deltaTime) => {
  world.update(deltaTime);
});
```

***

## Getting started
The package is available on [npm](https://www.npmjs.com/package/@typeonce/ecs):

```bash
pnpm add @typeonce/ecs
```

Creating a new ECS game uses the `ECS.create` function:

```ts
import { ECS } from "@typeonce/ecs";

const world = ECS.create(() => {
  // Initialize the game
});
```

> Every call to `ECS.create` creates a new world. You can use *multiple worlds for different scenes*.

The function inside `ECS.create` is where you initialize the game:
- Add systems
- Create initial entities (player, tiles, etc.)
- Add components to entities

```ts
import { ECS } from "@typeonce/ecs";

const world = ECS.create(({ addComponent, addSystem, createEntity }) => {
  // Add systems (accepts multiple systems at once)
  addSystem(new MovementSystem(), new RenderSystem());

  // Create an entity, returns its `EntityId`
  const entityId = createEntity();

  // Add a component to the entity (accepts multiple components at once)
  addComponent(entityId, new Player(), new Position({ x: 0, y: 0 }));
});
```

Components are defined using the `Component` function:

```ts
import { Component } from "@typeonce/ecs";

export class Position extends Component("Position")<{
  x: number;
  y: number;
}> {}

export class Player extends Component("Player")<{}> {}
```

Systems use the `System` function to define a system's factory:

```ts
import { System } from "@typeonce/ecs";

// Derive a system factory from the `System` function
const SystemFactory = System<"Movement" | "Render">();

// Use the factory to create a system
export class RenderSystem extends SystemFactory<{}>("Render", {
  execute: ({ world }) => {
    // Implement the system logic
  },
}) {}

// Use the factory to create a system
export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world }) => {
    // Implement the system logic
  },
}) {}
```

The `execute` function is where you implement the system logic. It provides a set of utility functions to manage entities, components, and systems in the game:

```ts
export class FoodSpawnSystem extends SystemFactory<{
  width: number;
  height: number;
}>("FoodSpawn", {
  // Execute this system after the `Collision` system
  dependencies: ["Collision"],

  execute: ({
    poll,
    destroyEntity,
    createEntity,
    addComponent,

    // 👇 Extract the `width` and `height` from the input
    input: { width, height },
  }) => {
    // Listen for the `FoodEaten` event
    poll(FoodEatenEvent).forEach((event) => {
      // 👇 Destroy the entity that was eaten
      destroyEntity(event.data.entityId);

      // 👇 Spawn a new food entity
      addComponent(
        createEntity(),
        new Position({
          x: Math.random() * width,
          y: Math.random() * height,
        }),
        new Size({ size: 10 }),
        new Food({ value: 10 }),
        new Collidable({ entity: "food" }),
        new Renderable({ color: "#D80032" }),
      );
    });
  },
}) {}
```

The created `ECS` instance provides an `update` function that you can call each frame to update the game, using whatever other library or framework you prefer:

> Calling `update` will execute all the systems in the world **one time**. You are expected to call `update` once per frame (or whatever other frequency you prefer).

```ts
// Create a world for a snake game (add systems, create entities, etc.)
const world = ECS.create<SystemTags, GameEventMap>(
  ({ addComponent, createEntity, addSystem }) => {
    addComponent(
      createEntity(),
      new Size({ size: 10 }),
      new Position({
        x: ctx.canvas.width / 2,
        y: ctx.canvas.height / 2,
      }),
      new SnakeHead(),
      new Collidable({ entity: "snake" }),
      new Renderable({ color: "#2B2D42" }),
      new Velocity({ dx: 0, dy: -1, speed: 0.1 }),
      new FollowTarget({ x: 0, y: 0 })
    );

    addSystem(
      new SnakeGrowSystem(),
      new CollisionSystem(),
      new MovementSystem(),
      new FollowSystem(),
      new TargetSystem({ followDelayCycles: undefined }),
      new RenderSystem({ ctx }),
      new SnakeControllerSystem({ inputManager }),
      new FoodSpawnSystem({
        width: ctx.canvas.width,
        height: ctx.canvas.height,
      })
    );
  }
);

// Apply any rendering logic by executing the `update` function from `ECS`
renderer((deltaTime) => world.update(deltaTime));
```

Another example is using [`pixi.js`](https://pixijs.com/) to render the game by executing the `update` function inside `app.ticker.add`:

```ts
import * as PIXI from "pixi.js";

const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

// Create `world` and initialize game

app.ticker.add(({ deltaTime }) => {
  world.update(deltaTime);
});
```

### Extracting entities
In ECS you want to query all the entities that have (or not have) a specific set of components attached.

For that you can use the `query` and `queryRequired` functions.

> `queryRequired` requires **at least one entity** to exist in the game, otherwise executing the query will throw.

A query is defined as a map of components. It can be defined *outside a system* and reused between them.

When executed it returns an array of entities that have the defined components attached (**type-safe based on the keys of the map** inside `query`):

```ts
// 👇 Query all the entities with `Renderable`, `Position` and `Size` components
const renderPosition = query({
  renderable: Renderable,
  position: Position,
  size: Size,
});

export class RenderSystem extends SystemFactory<{
  ctx: CanvasRenderingContext2D;
}>("Render", {
  execute: ({ world, input: { ctx } }) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 👇 Extract the entities from the `world` using the query (type-safe)
    renderPosition(world).forEach(({ renderable, position, size }) => {
      ctx.fillStyle = renderable.color;
      ctx.beginPath();
      ctx.arc(position.x, position.y, size.size, 0, Math.PI * 2);
      ctx.fill();
    });
  },
}) {}
```

`queryRequired` can be used to extract a single entity:

```ts
const requiredHead = queryRequired({
  snake: SnakeHead,
  velocity: Velocity,
  position: Position,
  size: Size,
});

export class SnakeControllerSystem extends SystemFactory<{
  inputManager: InputManager;
}>("SnakeController", {
  execute: ({ world, input: { inputManager } }) => {
    // 👇 At least one entity is guaranteed to exist in the game (`[0]` is always defined)
    const snakeHead = requiredHead(world)[0];

    if (inputManager.isKeyPressed("ArrowUp")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = -1;
    } else if (inputManager.isKeyPressed("ArrowDown")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = 1;
    } else if (inputManager.isKeyPressed("ArrowLeft")) {
      snakeHead.velocity.dx = -1;
      snakeHead.velocity.dy = 0;
    } else if (inputManager.isKeyPressed("ArrowRight")) {
      snakeHead.velocity.dx = 1;
      snakeHead.velocity.dy = 0;
    }
  },
}) {}
```

Both `query` and `queryRequired` accept a second optional parameter which is a list of the components that should be **excluded from the query**:

```ts
// 👇 Query all the entities with `Position` and `Velocity` components, and don't have `Collidable`
const moving = query({ position: Position, velocity: Velocity }, [Collidable]);
```

### Communication between systems
Events are used to send messages between systems. Any system has access to the `emit` function to emit events:

> Events are type-safe and must be defined in the `GameEventMap` type.

```ts
export const FoodEatenEvent = Symbol("FoodEaten");

export interface GameEventMap extends EventMap {
  [FoodEatenEvent]: { entityId: EntityId };
}
```

You can then emit an event using the `emit` function:

```ts
// 👇 Apply the `GameEventMap` type to the `SystemFactory` function to make events type-safe
const SystemFactory = System<SystemTags, GameEventMap>();

export class CollisionSystem extends SystemFactory<{}>("Collision", {
  execute: ({ emit }) => {
    if (/* collision detected */) {
      emit({
        type: FoodEatenEvent, // 👈 Emit the event from its unique symbol
        data: { entityId: entity.entityId }, // 👈 Pass the entity that was eaten
      });
    }
  },
}) {}
```

Other systems can use the `poll` function to extract events and react to them:

> Important: events are **cleaned up after each update cycle**. If you want to ensure an event was emitted before executing a system you can use `dependencies` (see below).

```ts
export class SnakeGrowSystem extends SystemFactory<{}>("SnakeGrow", {
  dependencies: ["Collision"], // 👈 Ensure the `Collision` system has been executed and events collected
  execute: ({ poll }) => {
    poll(FoodEatenEvent).forEach(({ entityId }) => {
      // Do something with the event (`entityId`)
    });
  },
}) {}
```

### Systems dependencies
Sometimes you need to execute a system after another system.

For example, you might want to spawn food only after the snake has eaten it. This creates a dependency between the `FoodSpawnSystem` and the `CollisionSystem`: you first want to detect collisions, and then spawn food if a collision occurs.

You can define a dependency between two systems using the *optional* `dependencies` property:

```ts
export class FoodSpawnSystem extends SystemFactory<{}>("FoodSpawn", {
  // Execute this system after the `Collision` system
  dependencies: ["Collision"],

  execute: ({ world }) => {
    // Inside here all collisions are already detected from the `CollisionSystem`
  },
}) {}
```

You can specify multiple dependencies. The library takes care of resolving each system's dependencies and execute them in the correct order.

***

## API

### `Component`
Defines a component class with a tag and properties.

In the example below, the component is tagged as `"Position"` and has two properties: `x` and `y`.

```ts
export class Position extends Component("Position")<{
  x: number;
  y: number;
}> {}
```

You can then create instances of the component like any other class:

```ts
const position = new Position({ x: 10, y: 20 });
```

You can also copy the properties of the component using the spread operator:

```ts
const position = new Position({ x: 10, y: 20 });
const newPosition = new Position({ ...position, x: 30 });
```

> Component classes are **mutable**, so you can change the properties of the component inside a system.


### `System`
Defines a systems' factory. It accepts two generic parameters:
- A union of all the tags of the systems in the world
- An `EventMap` of all the possible emitted events in the world

```ts
import { type EntityId, type EventMap, System } from "@typeonce/ecs";

export const FoodEatenEvent = Symbol("FoodEaten");
export interface GameEventMap extends EventMap {
  [FoodEatenEvent]: { entityId: EntityId };
}

export type SystemTags =
  | "Movement"
  | "PostMovement"
  | "Render"
  | "Input"
  | "Collision"
  | "ApplyMovement";

const SystemFactory = System<SystemTags, GameEventMap>();
```

`SystemFactory` is then used to create systems. A system is defined as a class:
- The generic parameter defines the input type required to create an instance of the system
- The first parameter is the tag of the class (must be included in the `SystemTags` used when creating `SystemFactory` from `System`)
- The second parameter requires an `execute` function and an optional `dependencies`
  - `execute` is the implementation of the system
  - `dependencies` defines the tags of the systems that are required to execute before the current one

```ts
const SystemFactory = System<SystemTags, GameEventMap>();

export class CollisionSystem extends SystemFactory<{
  // 👇 Input required
  gridSize: { width: number; height: number };
}>("Collision", {
  dependencies: ["Movement"],
  execute: (params) => {
    // 👉 System logic
  },
}) {}
```

`params` inside `execute` provide utility functions to manage entities, components, and systems in the game:
- `deltaTime`
- `world`: Reference to current instance of the game world
- `addSystem`: Adds one or more systems to the game
- `createEntity`: Creates an entity and returns its `EntityId` (`number`)
- `destroyEntity`: Removes an entity from its `EntityId`
- `addComponent`: Adds one or more components to an entity from its `EntityId`
- `removeComponent`: Removes one or more components to an entity from its `EntityId`
- `getComponentRequired`: Gets one or more components from an entity from its `EntityId`. The components are expected to be found, otherwise the function will throw an `Error`
- `getComponent`: Gets one or more components from an entity from its `EntityId` (not required, it may return `undefined`)
- `emit`: Emits an event that something happened in the game
- `poll`: Reads events emitted by other systems during the current update cycle

### `ECS`
An actual instance of `World` is created using the ECS class from `ECS.create`. You can provide two generic parameters (same as `System`):
- A union of all the tags of the systems in the world
- An `EventMap` of all the possible emitted events in the world

You can implement a function to initialize the game using the following provided utility functions:
- `addSystem`
- `createEntity`
- `addComponent`

### `query`
Defines a map of components used to query the world for all the entities that have the defined components attached.

It can be defined outside a system and reused between them.

```ts
// A query for all the entities with both `Position` and `Movement` components
const moving = query({ position: Position, movement: Movement });
```

You can then provide an instance of `World` to extract all the entities:

```ts
const moving = query({ position: Position, movement: Movement });

export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world }) => {
    moving(world).forEach(({ position, movement, entityId }) => {
      // Do something with each entity and its `position` and `movement` components
    });
  },
}) {}
```

### `queryRequired`
Defines a map of components used to query the world for all the entities that have the defined components attached (same as `query`).

It requires at least one entity to exist in the game, otherwise executing the query will throw (returns a non-empty array of entities).

> This is useful to extract a single entity you know must exist in the game, for example a "player" entity.

It can be defined outside a system and reused between them.

```ts
// A query for all the entities with both `Movement` and `Player` components
const playerQuery = queryRequired({ movement: Movement, player: Player });
```

You can then provide an instance of `World` to extract all the entities:

```ts
const playerQuery = queryRequired({ movement: Movement, player: Player });

export class InputSystem extends SystemFactory<{}>("Input", {
  execute: ({ world }) => {
    // 👇 The first element in the array is guaranteed to exist (`[0]`)
    const { movement, player, entityId } = playerQuery(world)[0];
  },
}) {}
```
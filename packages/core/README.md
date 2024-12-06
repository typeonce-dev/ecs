# `ecs`
An **Entity Component System** (ECS) implementation in TypeScript, extensible, working with any renderer, type safe and composable 🕹️

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
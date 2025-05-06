import * as Command from "./command.js";
import * as Entity from "./entity.js";
import * as Pipeable from "./pipeable.js";
import * as Resource from "./resource.js";
import * as System from "./system.js";
import type { NonEmptyArray } from "./types.js";

export const AppTypeId = Symbol.for("ecs/App");

export type AppTypeId = typeof AppTypeId;

export interface App extends Pipeable.Pipeable {
  readonly [AppTypeId]: AppTypeId;

  // `string` identifier
  readonly resources: ReadonlyMap<string, Resource.Resource.Any>;
  readonly systems: ReadonlyMap<System.SystemType, System.System.Any[]>;
}

const make = ({
  systems,
  resources,
}: {
  systems: ReadonlyMap<System.SystemType, System.System.Any[]>;
  resources: ReadonlyMap<string, Resource.Resource.Any>;
}): App => {
  const app = Object.create(Pipeable.PipeablePrototype) as any;
  app.systems = systems;
  app.resources = resources;
  return app;
};

export const empty = () =>
  make({
    systems: new Map(),
    resources: new Map(),
  });

const addSystem =
  <Tag extends string>(
    systemType: System.SystemType,
    system: System.System<Tag>
  ) =>
  (app: App): App => {
    // TODO: `HashMap`?
    const newMap = new Map(app.systems);
    newMap.set(systemType, [...(newMap.get(systemType) ?? []), system]);
    return make({ systems: newMap, resources: app.resources });
  };

export const setupSystem = <Tag extends string>(system: System.System<Tag>) =>
  addSystem("Startup", system);

export const updateSystem = <Tag extends string>(system: System.System<Tag>) =>
  addSystem("Update", system);

export const addResource =
  <Tag extends string, Value extends object>(tag: Tag, value: Value) =>
  (app: App): App => {
    // TODO: `HashMap`?
    const newMap = new Map(app.resources);
    newMap.set(tag, Resource.make(tag, value));
    return make({ systems: app.systems, resources: newMap });
  };

const executeQueue =
  ({
    entityId,
    entities,
    resources,
  }: {
    entityId: number;
    entities: Set<Entity.EntityId>;
    resources: Map<string, Resource.Resource.Any>;
  }) =>
  <T extends Command.Command>(...commands: NonEmptyArray<NoInfer<T>>) => {
    for (const command of commands) {
      switch (command._tag) {
        case "SPAWN":
          entities.add(entityId++ as Entity.EntityId);
          break;
        case "SPAWN_BATCH":
          // TODO
          break;
        case "INSERT_RESOURCE":
          resources.set(command.resource._tag, command.resource);
          break;
        case "REMOVE_RESOURCE":
          resources.delete(command.resource._tag);
          break;
        case "REGISTER_SYSTEM":
          // TODO
          break;
        case "UNREGISTER_SYSTEM":
          // TODO
          break;
        default:
          const _: never = command;
      }
    }
  };

export const update = (app: App) => {
  let entityId = 0;
  const entities = new Set<Entity.EntityId>();
  const resources = new Map<string, Resource.Resource.Any>(app.resources);

  const queue = executeQueue({ entityId, entities, resources });

  const startupSystems = app.systems.get("Startup") ?? [];
  for (const system of startupSystems) {
    // TODO: No deltaTime on startup
    system.run({ deltaTime: 0, queue });
  }

  return (deltaTime: number) => {
    const updateSystems = app.systems.get("Update") ?? [];
    for (const system of updateSystems) {
      system.run({ deltaTime, queue });
    }
  };
};

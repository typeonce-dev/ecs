import * as Entity from "./entity.js";
import * as Pipeable from "./pipeable.js";
import * as Resource from "./resource.js";
import * as System from "./system.js";

export const AppTypeId = Symbol.for("ecs/App");

export type AppTypeId = typeof AppTypeId;

export interface App extends Pipeable.Pipeable {
  readonly [AppTypeId]: AppTypeId;

  // `string` identifier
  readonly resources: ReadonlyMap<string, Resource.Resource>;
  readonly systems: ReadonlyMap<System.SystemType, System.System.Any[]>;
}

const make = ({
  systems,
  resources,
}: {
  systems: ReadonlyMap<System.SystemType, System.System.Any[]>;
  resources: ReadonlyMap<string, Resource.Resource>;
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

export const addSystem =
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

export const addResource =
  <Tag extends string>(tag: Tag, resource: Resource.Resource) =>
  (app: App): App => {
    // TODO: `HashMap`?
    const newMap = new Map(app.resources);
    newMap.set(tag, resource);
    return make({ systems: app.systems, resources: newMap });
  };

export const update = (app: App) => {
  const startupSystems = app.systems.get("Startup") ?? [];
  const entities = new Set();
  for (const system of startupSystems) {
    // TODO: No deltaTime on startup
    system.run({
      deltaTime: 0,
      queue: (...commands) => {
        for (const command of commands) {
          switch (command._op) {
            case "SPAWN":
              entities.add("" as unknown as Entity.EntityId); // TODO: `EntityId`
              break;
            case "SPAWN_BATCH":
              // TODO
              break;
            case "INSERT_RESOURCE":
              // TODO
              break;
            case "REMOVE_RESOURCE":
              // TODO
              break;
            case "REGISTER_SYSTEM":
              // TODO
              break;
            case "UNREGISTER_SYSTEM":
              // TODO
              break;
            default:
              const _: never = command._op;
          }
        }
      },
    });
  }

  return (deltaTime: number) => {
    const updateSystems = app.systems.get("Update") ?? [];
    for (const system of updateSystems) {
      system.run({
        deltaTime,
        queue: (...commands) => {
          for (const command of commands) {
            switch (command._op) {
              case "SPAWN":
                // TODO
                break;
              case "SPAWN_BATCH":
                // TODO
                break;
              case "INSERT_RESOURCE":
                // TODO
                break;
              case "REMOVE_RESOURCE":
                // TODO
                break;
              case "REGISTER_SYSTEM":
                // TODO
                break;
              case "UNREGISTER_SYSTEM":
                // TODO
                break;
              default:
                const _: never = command._op;
            }
          }
        },
      });
    }
  };
};

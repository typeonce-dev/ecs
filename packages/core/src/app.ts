import * as Entity from "./entity.js";
import * as Pipeable from "./pipeable.js";
import * as System from "./system.js";

export const AppTypeId = Symbol.for("ecs/App");

export type AppTypeId = typeof AppTypeId;

export interface App extends Pipeable.Pipeable {
  readonly [AppTypeId]: AppTypeId;

  readonly entities: Set<Entity.EntityId>;
  readonly systems: Map<System.SystemType, System.System.Any>;
}

export const empty = (): App => {
  const app = Object.create(Pipeable.PipeablePrototype) as any;
  app.entities = new Set();
  app.systems = new Map();
  return app;
};

export const addSystem =
  <Tag extends string>(
    systemType: System.SystemType,
    system: System.System<Tag>
  ) =>
  (app: App): App => {
    return app;
  };

export const run = (app: App) => {
  const systems = Array.from(app.systems.values());
  for (const system of systems) {
    system.run({
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

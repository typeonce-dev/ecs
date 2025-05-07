import * as Command from "./command.js";
import * as Entity from "./entity.js";
import * as Pipeable from "./pipeable.js";
import * as Resource from "./resource.js";
import * as System from "./system.js";
import type { NonEmptyArray } from "./types.js";

export const AppTypeId = Symbol.for("ecs/App");

export type AppTypeId = typeof AppTypeId;

export interface App<R extends Record<string, object>>
  extends Pipeable.Pipeable {
  readonly [AppTypeId]: AppTypeId;

  readonly resources: ReadonlyMap<
    Extract<keyof R, string>,
    Resource.Resource.Any
  >;
  readonly systems: ReadonlyMap<
    System.SystemType,
    System.System.AnyWithResource<R>[]
  >;
}

const make = <R extends Record<string, object>>({
  systems,
  resources,
}: {
  systems: ReadonlyMap<System.SystemType, System.System.AnyWithResource<R>[]>;
  resources: ReadonlyMap<string, Resource.Resource.Any>;
}): App<R> => {
  const app = Object.create(Pipeable.PipeablePrototype) as any;
  app.systems = systems;
  app.resources = resources;
  return app;
};

type IsNever<T> = [T] extends [never] ? true : false;

export const empty = <
  R extends Record<string, object> = never
>(): IsNever<R> extends false ? App<R> : never =>
  make({ systems: new Map(), resources: new Map() }) as any;

const addSystem =
  <R extends Record<string, object>, Tag extends string>(
    systemType: System.SystemType,
    system: System.System<Tag, R>
  ) =>
  (app: App<R>): App<R> => {
    // TODO: `HashMap`?
    const newMap = new Map(app.systems);
    newMap.set(systemType, [
      ...((newMap.get(systemType) ?? []) as any),
      system,
    ]);
    return make({ systems: newMap, resources: app.resources });
  };

export const startupSystem =
  <R extends Record<string, object>, Tag extends string>(
    tag: Tag,
    run: (params: System.SystemParams<R>) => void
  ) =>
  (app: App<R>): App<R> => {
    let newApp = make<R>({
      systems: new Map(app.systems),
      resources: new Map(app.resources),
    });
    newApp = addSystem<R, Tag>("Startup", System.make(tag, run as any))(newApp);
    return newApp;
  };

export const updateSystem =
  <R extends Record<string, object>, Tag extends string>(
    tag: Tag,
    run: (params: System.SystemParams<R>) => void
  ) =>
  (app: App<R>): App<R> => {
    let newApp = make({
      systems: new Map(app.systems),
      resources: new Map(app.resources),
    });
    newApp = addSystem<R, Tag>("Update", System.make(tag, run as any))(newApp);
    return newApp;
  };

export const addResource =
  <R extends Record<string, object>, Tag extends Extract<keyof R, string>>(
    tag: Tag,
    value: R[Tag]
  ) =>
  (app: App<R>): App<R> => {
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

const extractResource =
  <R extends Record<string, object>>(
    resources: ReadonlyMap<Extract<keyof R, string>, Resource.Resource.Any>
  ) =>
  <Tag extends Extract<keyof R, string>>(tag: Tag): R[Tag] => {
    return resources.get(tag)!.value as R[Tag];
  };

const updateResource =
  <R extends Record<string, object>>(
    resources: Map<Extract<keyof R, string>, Resource.Resource.Any>
  ) =>
  <Tag extends Extract<keyof R, string>>(tag: Tag, value: R[Tag]) => {
    resources.set(tag, Resource.make(tag, value));
  };

export const update = <R extends Record<string, object>>(app: App<R>) => {
  let entityId = 0;
  const entities = new Set<Entity.EntityId>();
  const resources = new Map<Extract<keyof R, string>, Resource.Resource.Any>(
    app.resources
  );

  const queue = executeQueue({ entityId, entities, resources });

  const startupSystems = app.systems.get("Startup") ?? [];
  for (const system of startupSystems) {
    const getResource = extractResource<R>(resources);
    const setResource = updateResource<R>(resources);
    system.run({ deltaTime: 0, queue, getResource, setResource });
  }

  return (deltaTime: number) => {
    const updateSystems = app.systems.get("Update") ?? [];
    for (const system of updateSystems) {
      const getResource = extractResource<R>(resources);
      const setResource = updateResource<R>(resources);
      system.run({ deltaTime, queue, getResource, setResource });
    }
  };
};

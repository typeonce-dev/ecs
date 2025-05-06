import type * as Component from "./component.js";
import type * as Resource from "./resource.js";
import type * as System from "./system.js";
import type { NonEmptyArray } from "./types.js";

export type Command =
  | {
      readonly _tag: "SPAWN";
      readonly components: Array<Component.Component.Any>;
    }
  | {
      readonly _tag: "SPAWN_BATCH";
      readonly components: Array<Component.Component.Any>;
    }
  | {
      readonly _tag: "INSERT_RESOURCE";
      readonly resource: Resource.Resource.Any;
    }
  | {
      readonly _tag: "REMOVE_RESOURCE";
      readonly resource: Resource.Resource.Any;
    }
  | { readonly _tag: "REGISTER_SYSTEM"; readonly system: System.System.Any }
  | { readonly _tag: "UNREGISTER_SYSTEM"; readonly system: System.System.Any };

export const spawnEmpty = (): Command => {
  return { _tag: "SPAWN", components: [] };
};

export const spawn = <T extends Component.Component.Any>(
  ...components: NonEmptyArray<NoInfer<T>>
): Command => {
  return { _tag: "SPAWN", components };
};

export const spawnBatch = <T extends Component.Component.Any>(
  ...components: NonEmptyArray<NoInfer<T>>
): Command => {
  return { _tag: "SPAWN_BATCH", components };
};

export const insertResource = <T extends Resource.Resource.Any>(
  ...resources: NonEmptyArray<NoInfer<T>>
): NonEmptyArray<Command> => {
  return resources.map((resource) => ({
    _tag: "INSERT_RESOURCE",
    resource,
  })) as unknown as NonEmptyArray<Command>;
};

export const removeResource = <T extends Resource.Resource.Any>(
  ...resources: NonEmptyArray<NoInfer<T>>
): NonEmptyArray<Command> => {
  return resources.map((resource) => ({
    _tag: "REMOVE_RESOURCE",
    resource,
  })) as unknown as NonEmptyArray<Command>;
};

export const registerSystem = <T extends System.System.Any>(
  ...systems: NonEmptyArray<NoInfer<T>>
): NonEmptyArray<Command> => {
  return systems.map((system) => ({
    _tag: "REGISTER_SYSTEM",
    system,
  })) as unknown as NonEmptyArray<Command>;
};

export const unregisterSystem = <T extends System.System.Any>(
  ...systems: NonEmptyArray<NoInfer<T>>
): NonEmptyArray<Command> => {
  return systems.map((system) => ({
    _tag: "UNREGISTER_SYSTEM",
    system,
  })) as unknown as NonEmptyArray<Command>;
};

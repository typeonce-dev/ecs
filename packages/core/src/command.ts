import type * as Component from "./component.js";
import type * as Resource from "./resource.js";
import type * as System from "./system.js";
import type { NonEmptyArray } from "./types.js";

export const CommandTypeId = Symbol.for("ecs/Command");

export type CommandTypeId = typeof CommandTypeId;

export interface Command {
  readonly [CommandTypeId]: CommandTypeId;
  readonly _op:
    | "SPAWN"
    | "SPAWN_BATCH"
    | "INSERT_RESOURCE"
    | "REMOVE_RESOURCE"
    | "REGISTER_SYSTEM"
    | "UNREGISTER_SYSTEM"; // TODO: What about the command params?
}

export const spawnEmpty = (): Command => {
  return make("SPAWN");
};

export const spawn = <T extends Component.Component.Any>(
  ...components: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("SPAWN");
};

export const spawnBatch = <T extends Component.Component.Any>(
  ...components: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("SPAWN_BATCH");
};

export const insertResource = <T extends Resource.Resource>(
  ...resources: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("INSERT_RESOURCE");
};

export const removeResource = <T extends Resource.Resource>(
  ...resources: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("REMOVE_RESOURCE");
};

export const registerSystem = <T extends System.System.Any>(
  ...systems: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("REGISTER_SYSTEM");
};

export const unregisterSystem = <T extends System.System.Any>(
  ...systems: NonEmptyArray<NoInfer<T>>
): Command => {
  return make("UNREGISTER_SYSTEM");
};

/** @internal */
export const make = (op: Command["_op"]): Command => {
  return {
    [CommandTypeId]: CommandTypeId,
    _op: op,
  };
};

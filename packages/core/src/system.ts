import * as Command from "./command.js";
import type { NonEmptyArray } from "./types.js";

export const SystemTypeId = Symbol.for("ecs/System");

export type SystemTypeId = typeof SystemTypeId;

export interface System<Tag extends string, R extends Record<string, object>> {
  readonly [SystemTypeId]: SystemTypeId;
  readonly _tag: Tag;
  readonly commands: Command.Command[];
  readonly run: (params: SystemParams<R>) => void;
}

export type SystemType = "Startup" | "Update" | "FixedUpdate";

export namespace System {
  export type AnyWithResource<R extends Record<string, object>> = System<
    string,
    R
  >;
}

export interface SystemParams<R extends Record<string, object>> {
  deltaTime: number;
  getResource: <Tag extends Extract<keyof R, string>>(tag: Tag) => R[Tag];
  setResource: <Tag extends Extract<keyof R, string>>(
    tag: Tag,
    value: R[Tag]
  ) => void;
  queue: <T extends Command.Command>(
    ...commands: NonEmptyArray<NoInfer<T>>
  ) => void;
}

export const make = <Tag extends string, R extends Record<string, object>>(
  tag: Tag,
  run: (params: SystemParams<R>) => void
): System<Tag, R> => {
  return {
    [SystemTypeId]: SystemTypeId,
    _tag: tag,
    commands: [],
    run,
  };
};

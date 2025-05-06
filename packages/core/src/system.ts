import * as Command from "./command.js";
import type { NonEmptyArray } from "./types.js";

export const SystemTypeId = Symbol.for("ecs/System");

export type SystemTypeId = typeof SystemTypeId;

export interface System<Tag extends string> {
  readonly [SystemTypeId]: SystemTypeId;
  readonly _tag: Tag;
  readonly commands: Command.Command[];
  readonly run: (params: SystemParams) => void;
}

export type SystemType = "Startup" | "Update" | "FixedUpdate";

export namespace System {
  export type Any = System<string>;
}

interface SystemParams {
  deltaTime: number;
  queue: <T extends Command.Command>(
    ...commands: NonEmptyArray<NoInfer<T>>
  ) => void;
}

export const make =
  <Tag extends string>(tag: Tag) =>
  (run: (params: SystemParams) => void): System<Tag> => {
    return {
      [SystemTypeId]: SystemTypeId,
      _tag: tag,
      commands: [],
      run,
    };
  };

export * from "./ecs";
export * from "./types";

import { Component } from "./ecs";
import * as Query from "./query.js";

class Size extends Component("Size")<{ size: number }> {}
class Position extends Component("Position")<{ x: number }> {}

const readQuery = void 0 as unknown as Query.ReadQuery<{
  size: typeof Size;
  position: typeof Position;
}>;

const writeQuery = void 0 as unknown as Query.WriteQuery<Size>;

const System1 = Query.Tag("System1")(function* (params: { source: string }) {
  return { num: 1 as const, source: params.source };
});

export const system1 = Query.gen(function* () {
  const dep = yield* System1;
  const num = yield* readQuery;
  for (const { entityId: _, size } of num) {
    const _addedNum = yield* writeQuery.set(new Size({ size: size.size + 1 }));
  }

  return "some";
});

export const system2 = Query.gen(function* () {
  const dep = yield* system1;
});

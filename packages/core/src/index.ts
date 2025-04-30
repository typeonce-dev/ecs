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

const System2 = Query.Tag("System2")(function* (params: { source: string }) {
  const dep = yield* System1;
  const num = yield* readQuery;
  for (const { entityId: _, size } of num) {
    const _addedNum = yield* writeQuery.set(new Size({ size: size.size + 1 }));
  }

  return "some" as const;
});

const System3 = Query.Tag("System3")(function* (params: { source: string }) {
  const dep1 = yield* System1;
  const dep2 = yield* System2;
  const num = yield* readQuery;
  return 10 as const;
});

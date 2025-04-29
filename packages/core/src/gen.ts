import { Component } from "./ecs";
import type {
  ComponentClass,
  ComponentClassMap,
  ComponentInstanceMap,
  EntityId,
} from "./types";

type ComponentInstance = InstanceType<ReturnType<typeof Component>>;

type ReadComponentInstanceMap<M extends ComponentClassMap> = {
  [K in keyof M]: Read<InstanceType<M[K]>>;
}[keyof M] extends infer U
  ? U
  : never;

const ReadTypeId: unique symbol = Symbol.for("ecs/Read");

interface Read<Component extends InstanceType<ComponentClass<any>>> {
  readonly [ReadTypeId]: Component;
}

const WriteTypeId: unique symbol = Symbol.for("ecs/Write");

interface Write<Component extends InstanceType<ComponentClass<any>>> {
  readonly [WriteTypeId]: Component;
}

interface ReadQuery<M extends ComponentClassMap> {
  [Symbol.iterator](): QueryGenerator<
    QueryEffect<
      ({ entityId: EntityId } & ComponentInstanceMap<M>)[],
      ReadComponentInstanceMap<M>
    >
  >;
}

interface WriteQuery<Component extends ComponentInstance> {
  set: (value: Component) => {
    [Symbol.iterator](): QueryGenerator<
      QueryEffect<
        /** Access the updated component even before the update is executed */
        Component,
        Write<Component>
      >
    >;
  };
}

interface QueryEffect<out A, out R = never> {
  readonly a: A;
  readonly r: R;
}

namespace QueryEffect {
  export type Success<T extends QueryEffect<any, any>> = [T] extends [
    QueryEffect<infer A, infer _R>
  ]
    ? A
    : never;

  export type Deps<T extends QueryEffect<any, any>> = [T] extends [
    QueryEffect<infer _A, infer R>
  ]
    ? R
    : never;
}

export interface QueryGenerator<T extends QueryEffect<any, any>> {
  next(
    ...args: ReadonlyArray<any>
  ): globalThis.IteratorResult<T, QueryEffect.Success<T>>;
}

const gen = <Eff extends QueryEffect<any, any>, AEff>(
  _f: () => globalThis.Generator<Eff, AEff, never>
): QueryEffect<
  AEff,
  [Eff] extends [never]
    ? never
    : [Eff] extends [QueryEffect<infer _A, infer R>]
    ? R
    : never
> => void 0 as any;

class Size extends Component("Size")<{ size: number }> {}
class Position extends Component("Position")<{ x: number }> {}

const readQuery = void 0 as unknown as ReadQuery<{
  size: typeof Size;
  position: typeof Position;
}>;

const writeQuery = void 0 as unknown as WriteQuery<Size>;

export const main = gen(function* () {
  const num = yield* readQuery;
  for (const { entityId: _, size } of num) {
    const _addedNum = yield* writeQuery.set(new Size({ size: size.size + 1 }));
  }

  return "some";
});

import { Component } from "./ecs.js";
import type {
  ComponentClass,
  ComponentClassMap,
  ComponentInstanceMap,
  EntityId,
} from "./types.js";

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

export interface ReadQuery<M extends ComponentClassMap> {
  [Symbol.iterator](): QueryGenerator<
    QueryEffect<
      ({ entityId: EntityId } & ComponentInstanceMap<M>)[],
      ReadComponentInstanceMap<M>
    >
  >;
}

export interface WriteQuery<Component extends ComponentInstance> {
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

export interface QueryEffect<out A, out Q = never, out R = never> {
  readonly a: A;
  readonly q: Q;
  readonly r: R;

  [Symbol.iterator](): QueryGenerator<QueryEffect<A, never, R>>;
}

export namespace QueryEffect {
  export type Any = QueryEffect<any, any, any>;

  export type Success<T extends QueryEffect.Any> = [T] extends [
    QueryEffect<infer A, infer _Q, infer _R>
  ]
    ? A
    : never;

  export type QueryDependencies<T extends QueryEffect.Any> = [T] extends [
    QueryEffect<infer _A, infer Q, infer _R>
  ]
    ? Q
    : never;

  export type SystemDependencies<T extends QueryEffect.Any> = [T] extends [
    QueryEffect<infer _A, infer _Q, infer R>
  ]
    ? R
    : never;
}

export interface QueryGenerator<T extends QueryEffect.Any> {
  next(
    ...args: ReadonlyArray<any>
  ): globalThis.IteratorResult<T, QueryEffect.Success<T>>;
}

export const gen = <Effect extends QueryEffect.Any, TReturn>(
  _f: () => globalThis.Generator<Effect, TReturn, never>
): QueryEffect<
  TReturn,
  [Effect] extends [never]
    ? never
    : [Effect] extends [QueryEffect<infer _A, infer Q, infer _R>]
    ? Q
    : never,
  [Effect] extends [never]
    ? never
    : [Effect] extends [QueryEffect<infer _A, infer _Q, infer R>]
    ? R
    : never
> => void 0 as any;

export const Tag: <const Id extends string>(
  id: Id
) => <Params, Event, Effect extends QueryEffect.Any>(
  gen: (params: Params) => globalThis.Generator<Effect, Event, never>
) => QueryEffect<Event, never, Id> = void 0 as any;

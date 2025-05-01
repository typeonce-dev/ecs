import { Component } from "./ecs.js";
import * as internal from "./internal/query.js";
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

export interface QueryEffect<
  out Event,
  out Query = never,
  out Dependencies = never
> {
  readonly event: Event;
  readonly query: Query;
  readonly dependencies: Dependencies;

  [Symbol.iterator](): QueryGenerator<QueryEffect<Event, Query, Dependencies>>;
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

export interface TagInstance<Id, Params, Event> {
  readonly key: Id;
  readonly params: Params;
  readonly execute: (params: Params) => Event;
}

export interface Tag<Id, Params, Event, Query, R>
  extends QueryEffect<Event, never, Id | R> {
  readonly _op: "Tag";
  readonly make: (params: Params) => TagInstance<Id, Params, Event>;
  readonly key: Id;
  [Symbol.iterator](): QueryGenerator<Tag<Id, Params, Event, Query, R>>;
}

export const Tag: <const Id extends string>(
  id: Id
) => <Params, Event, Effect extends QueryEffect.Any>(
  gen: (params: Params) => globalThis.Generator<Effect, Event, never>
) => Tag<
  Id,
  Params,
  Event,
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
> = internal.makeTag;

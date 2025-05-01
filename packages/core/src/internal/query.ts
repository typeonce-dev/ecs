import { SingleShotGen } from "../gen.js";
import type * as Query from "../query.js";

/** @internal */
export const TagProto = {
  _op: "Tag",
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
};

/** @internal */
export const makeTag =
  <Id extends string, Query, R>(key: Id) =>
  <Params, Event, Effect extends Query.QueryEffect.Any>(
    gen: (params: Params) => globalThis.Generator<Effect, Event, never>
  ): Query.Tag<Id, Params, Event, Query, R> => {
    const tag = Object.create(TagProto);
    tag.key = key;
    tag.make = (params: Params): Query.TagInstance<Id, Params, Event> => {
      return {
        key,
        params,
        execute: (params: Params): Event => {
          const generator = gen(params);
          let result = generator.next();
          while (!result.done) {
            const effect = result.value;

            result = generator.next();
          }

          return result.value;
        },
      };
    };
    return tag;
  };

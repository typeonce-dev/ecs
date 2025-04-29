import { SingleShotGen } from "./gen.js";
import * as Query from "./query.js";

export interface Tag<out Id, out Event> {
  [Symbol.iterator](): Query.QueryGenerator<
    Query.QueryEffect<Event, never, Id>
  >;
}

export interface TagClassShape<Id, Event> {
  readonly Event: Event;
  readonly Id: Id;
}

export interface TagClass<Self, Id extends string, Event>
  extends Tag<Self, Event> {
  new (_: never): TagClassShape<Id, Event>;
  readonly key: Id;
}

/** @internal */
export const TagProto: any = {
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
};

/** @internal */
export const internalTag =
  <const Id extends string>(id: Id) =>
  <Self, Event>(): TagClass<Self, Id, Event> => {
    function TagClass() {}
    Object.setPrototypeOf(TagClass, TagProto);
    TagClass.key = id;
    return TagClass as any;
  };

export const Tag: <const Id extends string>(
  id: Id
) => <Self, Event>() => TagClass<Self, Id, Event> = internalTag;

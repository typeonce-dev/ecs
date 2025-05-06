export const ResourceTypeId = Symbol.for("ecs/Resource");

export type ResourceTypeId = typeof ResourceTypeId;

export interface Resource<Tag extends string, Value extends object> {
  readonly [ResourceTypeId]: ResourceTypeId;
  readonly _tag: Tag;
  readonly value: Value;
}

export namespace Resource {
  export type Any = Resource<string, object>;
}

export const make = <Tag extends string, Value extends object>(
  tag: Tag,
  value: Value
): Resource<Tag, Value> => {
  return { [ResourceTypeId]: ResourceTypeId, _tag: tag, value };
};

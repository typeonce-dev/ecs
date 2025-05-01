export const ResourceTypeId = Symbol.for("ecs/Resource");

export type ResourceTypeId = typeof ResourceTypeId;

export interface Resource {
  readonly [ResourceTypeId]: ResourceTypeId;
}

export const EntityIdTypeId: unique symbol = Symbol.for("ecs/EntityId");

export type EntityId = number & {
  readonly [EntityIdTypeId]: {
    readonly EntityId: "EntityId";
  };
};

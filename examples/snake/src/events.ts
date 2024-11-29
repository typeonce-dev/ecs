import type { EntityId, EventMap } from "@typeonce/ecs";

export const ArrowKeyPressedEvent = Symbol("ArrowKeyPressed");
export const FoodEatenEvent = Symbol("FoodEaten");

export interface GameEventMap extends EventMap {
  [FoodEatenEvent]: { entityId: EntityId };
}

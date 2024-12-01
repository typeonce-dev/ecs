import type { EntityId, EventMap } from "@typeonce/ecs";

export const DestroyEnemy = Symbol("DestroyEnemy");

export interface GameEventMap extends EventMap {
  [DestroyEnemy]: { bulletId: EntityId; enemyId: EntityId };
}

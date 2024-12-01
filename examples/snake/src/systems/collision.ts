import { query, type SystemUpdate } from "@typeonce/ecs";

import { Collidable, Position, SnakeBody } from "../components";
import { FoodEatenEvent, type GameEventMap } from "../events";

/**
 * https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection#circle_collision
 */
const checkCollision = (pos1: Position, pos2: Position): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < pos1.size + pos2.size;
};

const collidable = query({ position: Position, collidable: Collidable });

export const CollisionSystem: SystemUpdate<GameEventMap> = ({
  world,
  emit,
  getComponentRequired,
}) => {
  const entities = collidable(world);

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i]!;
      const entity2 = entities[j]!;

      if (checkCollision(entity1.position, entity2.position)) {
        const getSnakeBody = getComponentRequired({
          snake: SnakeBody,
        });

        if (
          entity1.collidable.entity === "snake" &&
          entity2.collidable.entity === "food"
        ) {
          emit({
            type: FoodEatenEvent,
            data: { entityId: entity2.entityId },
          });
        } else if (
          entity1.collidable.entity === "food" &&
          entity2.collidable.entity === "snake"
        ) {
          emit({
            type: FoodEatenEvent,
            data: { entityId: entity1.entityId },
          });
        } else if (
          entity1.collidable.entity === "snake" &&
          entity2.collidable.entity === "tail"
        ) {
          const snakeBody = getSnakeBody(entity2.entityId);
          if (snakeBody.snake.parentSegment !== entity1.entityId) {
            // this.resetGame();
          }
        } else if (
          entity1.collidable.entity === "tail" &&
          entity2.collidable.entity === "snake"
        ) {
          const snakeBody = getSnakeBody(entity1.entityId);
          if (snakeBody.snake.parentSegment !== entity2.entityId) {
            // this.resetGame();
          }
        }
      }
    }
  }
};

import type { EntityId, System, World } from "@typeonce/ecs";

import { CollidableComponent } from "../components/collidable";
import { PositionComponent } from "../components/position";
import { SnakeBodyComponent } from "../components/snake-body";
import { FoodEatenEvent, type GameEventMap } from "../events";

export class CollisionSystem<T extends GameEventMap> implements System<T> {
  constructor(private world: World<T>) {}

  update() {
    const entities = this.world.getEntitiesWithComponent({
      position: PositionComponent,
      collidable: CollidableComponent,
    });

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        if (this.checkCollision(entities[i]!.position, entities[j]!.position)) {
          this.handleCollision(
            [entities[i]!.entityId, entities[i]!.collidable],
            [entities[j]!.entityId, entities[j]!.collidable]
          );
        }
      }
    }
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection#circle_collision
   */
  private checkCollision(
    pos1: PositionComponent,
    pos2: PositionComponent
  ): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < pos1.size + pos2.size;
  }

  private handleCollision(
    [entity1, collidable1]: [EntityId, CollidableComponent],
    [entity2, collidable2]: [EntityId, CollidableComponent]
  ): void {
    if (collidable1.entity === "snake" && collidable2.entity === "food") {
      this.world.emitEvent({
        type: FoodEatenEvent,
        data: { entityId: entity2 },
      });
    } else if (
      collidable1.entity === "food" &&
      collidable2.entity === "snake"
    ) {
      this.world.emitEvent({
        type: FoodEatenEvent,
        data: { entityId: entity1 },
      });
    } else if (
      collidable1.entity === "snake" &&
      collidable2.entity === "tail"
    ) {
      const snakeBody = this.world.getComponent(entity2, {
        snake: SnakeBodyComponent,
      })!;
      if (snakeBody.snake.parentSegment !== entity1) {
        this.resetGame();
      }
    } else if (
      collidable1.entity === "tail" &&
      collidable2.entity === "snake"
    ) {
      const snakeBody = this.world.getComponent(entity1, {
        snake: SnakeBodyComponent,
      })!;
      if (snakeBody.snake.parentSegment !== entity2) {
        this.resetGame();
      }
    }
  }

  private resetGame() {
    this.world
      .getEntitiesWithComponent({
        snake: SnakeBodyComponent,
      })
      .forEach((entity) => {
        this.world.destroyEntity(entity.entityId);
      });
  }
}

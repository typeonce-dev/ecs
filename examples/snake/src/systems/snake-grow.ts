import type { System, World } from "@typeonce/ecs";

import { CollidableComponent } from "../components/collidable";
import { FollowTargetComponent } from "../components/follow-target";
import { PositionComponent } from "../components/position";
import { RenderableComponent } from "../components/renderable";
import { SnakeBodyComponent } from "../components/snake-body";
import { SnakeHeadComponent } from "../components/snake-head";
import { VelocityComponent } from "../components/velocity";
import { FoodEatenEvent, type GameEventMap } from "../events";

export class SnakeGrowSystem<T extends GameEventMap> implements System<T> {
  constructor(private world: World<T>) {}

  postUpdate() {
    this.world.pollEvents(FoodEatenEvent).forEach(() => {
      const snakeHead = this.world.getEntitiesWithComponentRequired({
        snake: SnakeHeadComponent,
        velocity: VelocityComponent,
        position: PositionComponent,
      })[0];

      if (!snakeHead) return;

      const snakeTail = this.world
        .getEntitiesWithComponent({
          snake: SnakeBodyComponent,
          position: PositionComponent,
        })
        .find((entity) => entity.snake.isTail);

      if (snakeTail) {
        snakeTail.snake.isTail = false;
      }

      this.world.addComponent(
        this.world.createEntity(),
        new SnakeBodyComponent(snakeTail?.entityId ?? snakeHead.entityId, true),
        new PositionComponent(
          (snakeTail ?? snakeHead).position.x -
            snakeHead.velocity.dx * snakeHead.position.size * 2,
          (snakeTail ?? snakeHead).position.y -
            snakeHead.velocity.dy * snakeHead.position.size * 2
        ),
        new FollowTargetComponent(0, 0),
        new CollidableComponent("tail"),
        new RenderableComponent("#ffa500")
      );
    });
  }
}

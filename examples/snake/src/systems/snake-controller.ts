import type { System, World } from "@typeonce/ecs";

import { SnakeHeadComponent } from "../components/snake-head";
import { VelocityComponent } from "../components/velocity";
import { type GameEventMap } from "../events";
import type { InputManager } from "../input-manager";

export class SnakeControllerSystem<T extends GameEventMap>
  implements System<T>
{
  constructor(private world: World<T>, private inputManager: InputManager) {}

  postUpdate() {
    const snakeHead = this.world.getEntitiesWithComponentRequired({
      snake: SnakeHeadComponent,
      velocity: VelocityComponent,
    })[0];

    if (this.inputManager.isKeyPressed("ArrowUp")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = -1;
    } else if (this.inputManager.isKeyPressed("ArrowDown")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = 1;
    } else if (this.inputManager.isKeyPressed("ArrowLeft")) {
      snakeHead.velocity.dx = -1;
      snakeHead.velocity.dy = 0;
    } else if (this.inputManager.isKeyPressed("ArrowRight")) {
      snakeHead.velocity.dx = 1;
      snakeHead.velocity.dy = 0;
    }
  }
}

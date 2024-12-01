import { queryRequired, type SystemUpdate } from "@typeonce/ecs";

import { SnakeHead, Velocity } from "../components";
import { type GameEventMap } from "../events";
import type { InputManager } from "../input-manager";

const requiredHead = queryRequired({
  snake: SnakeHead,
  velocity: Velocity,
});

export const SnakeControllerSystem =
  (inputManager: InputManager): SystemUpdate<GameEventMap> =>
  ({ world }) => {
    const snakeHead = requiredHead(world)[0];
    if (inputManager.isKeyPressed("ArrowUp")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = -1;
    } else if (inputManager.isKeyPressed("ArrowDown")) {
      snakeHead.velocity.dx = 0;
      snakeHead.velocity.dy = 1;
    } else if (inputManager.isKeyPressed("ArrowLeft")) {
      snakeHead.velocity.dx = -1;
      snakeHead.velocity.dy = 0;
    } else if (inputManager.isKeyPressed("ArrowRight")) {
      snakeHead.velocity.dx = 1;
      snakeHead.velocity.dy = 0;
    }
  };

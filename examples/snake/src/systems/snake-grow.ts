import { query, queryRequired, type SystemEvent } from "@typeonce/ecs";

import {
  Collidable,
  FollowTarget,
  Position,
  Renderable,
  SnakeBody,
  SnakeHead,
  Velocity,
} from "../components";
import { FoodEatenEvent, type GameEventMap } from "../events";

const requiredHead = queryRequired({
  snake: SnakeHead,
  velocity: Velocity,
  position: Position,
});

const tail = query({
  snake: SnakeBody,
  position: Position,
});

export const SnakeGrowSystem: SystemEvent<GameEventMap> = ({
  world,
  poll,
  addComponent,
  createEntity,
}) => {
  poll(FoodEatenEvent).forEach(() => {
    const snakeHead = requiredHead(world)[0];

    const snakeTail = tail(world).find((entity) => entity.snake.isTail);

    if (snakeTail) {
      snakeTail.snake.isTail = false;
    }

    addComponent(
      createEntity(),
      new SnakeBody({
        parentSegment: snakeTail?.entityId ?? snakeHead.entityId,
        isTail: true,
      }),
      new Position({
        x:
          (snakeTail ?? snakeHead).position.x -
          snakeHead.velocity.dx * snakeHead.position.size * 2,
        y:
          (snakeTail ?? snakeHead).position.y -
          snakeHead.velocity.dy * snakeHead.position.size * 2,
        size: snakeHead.position.size,
      }),
      new FollowTarget({ x: 0, y: 0 }),
      new Collidable({ entity: "tail" }),
      new Renderable({ color: "#ffa500" })
    );
  });
};

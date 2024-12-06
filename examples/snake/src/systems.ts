import { query, queryRequired, System } from "@typeonce/ecs";
import {
  Collidable,
  FollowTarget,
  Position,
  Renderable,
  Size,
  SnakeBody,
  SnakeHead,
  Velocity,
} from "./components";
import { FoodEatenEvent, type GameEventMap } from "./events";
import type { InputManager } from "./input-manager";
import { spawnFood } from "./utils";

export type SystemTags =
  | "SnakeGrow"
  | "SnakeController"
  | "Render"
  | "Movement"
  | "FoodSpawn"
  | "Follow"
  | "Collision"
  | "Target";

const SystemFactory = System<SystemTags, GameEventMap>();

const moving = query({ position: Position, velocity: Velocity });

const collidable = query({
  position: Position,
  collidable: Collidable,
  size: Size,
});

const snakeBodyPosition = query({ position: Position, snakeBody: SnakeBody });

const requiredHead = queryRequired({
  snake: SnakeHead,
  velocity: Velocity,
  position: Position,
  size: Size,
});

const tail = query({
  snake: SnakeBody,
  position: Position,
});

const renderPosition = query({
  renderable: Renderable,
  position: Position,
  size: Size,
});

const follow = query({
  position: Position,
  followTarget: FollowTarget,
});

export class SnakeGrowSystem extends SystemFactory<{}>("SnakeGrow", {
  dependencies: ["Collision"],
  execute: ({ world, poll, addComponent, createEntity }) => {
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
            snakeHead.velocity.dx * snakeHead.size.size * 2,
          y:
            (snakeTail ?? snakeHead).position.y -
            snakeHead.velocity.dy * snakeHead.size.size * 2,
        }),
        new Size({ size: snakeHead.size.size }),
        new FollowTarget({ x: 0, y: 0 }),
        new Collidable({ entity: "tail" }),
        new Renderable({ color: "#ffa500" })
      );
    });
  },
}) {}

export class SnakeControllerSystem extends SystemFactory<{
  inputManager: InputManager;
}>("SnakeController", {
  execute: ({ world, input: { inputManager } }) => {
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
  },
}) {}

export class RenderSystem extends SystemFactory<{
  ctx: CanvasRenderingContext2D;
}>("Render", {
  execute: ({ world, input: { ctx } }) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderPosition(world).forEach(({ renderable, position, size }) => {
      ctx.fillStyle = renderable.color;
      ctx.beginPath();
      ctx.arc(position.x, position.y, size.size, 0, Math.PI * 2);
      ctx.fill();
    });
  },
}) {}

export class MovementSystem extends SystemFactory<{}>("Movement", {
  execute: ({ world, deltaTime }) => {
    moving(world).forEach(({ position, velocity }) => {
      position.x += velocity.dx * velocity.speed * deltaTime;
      position.y += velocity.dy * velocity.speed * deltaTime;
    });
  },
}) {}

export class FoodSpawnSystem extends SystemFactory<{
  width: number;
  height: number;
}>("FoodSpawn", {
  dependencies: ["Collision"],
  execute: ({
    poll,
    destroyEntity,
    createEntity,
    addComponent,
    input: { width, height },
  }) => {
    poll(FoodEatenEvent).forEach((event) => {
      destroyEntity(event.data.entityId);
      addComponent(
        createEntity(),
        ...spawnFood(
          new Position({
            x: Math.random() * width,
            y: Math.random() * height,
          })
        )
      );
    });
  },
}) {}

export class FollowSystem extends SystemFactory<{}>("Follow", {
  execute: ({ world, deltaTime, getComponentRequired }) => {
    snakeBodyPosition(world).forEach(({ position, snakeBody }) => {
      const { followTarget } = getComponentRequired({
        followTarget: FollowTarget,
      })(snakeBody.parentSegment);

      const targetPosition = FollowSystem.interpolate2DWithDeltaTime(
        position,
        followTarget,
        deltaTime,
        0.1
      );

      position.x = targetPosition.x;
      position.y = targetPosition.y;
    });
  },
}) {
  static readonly interpolate2DWithDeltaTime = (
    current: { x: number; y: number },
    target: { x: number; y: number },
    deltaTime: number,
    speed: number
  ): { x: number; y: number } => {
    // Calculate the distance to the target
    const distanceX = target.x - current.x;
    const distanceY = target.y - current.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If already at the target or very close, return the target
    if (distance < 0.001) {
      return { x: target.x, y: target.y };
    }

    // Calculate the maximum distance to move this frame
    const maxDistance = speed * deltaTime;

    // Determine the interpolation factor (clamp to [0, 1])
    const t = Math.min(maxDistance / distance, 1);

    // Interpolate towards the target
    return {
      x: current.x + t * distanceX,
      y: current.y + t * distanceY,
    };
  };
}

export class CollisionSystem extends SystemFactory<{}>("Collision", {
  execute: ({ world, emit, getComponentRequired }) => {
    const entities = collidable(world);

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i]!;
        const entity2 = entities[j]!;

        if (
          CollisionSystem.checkCollision(
            entity1.position,
            entity2.position,
            entity1.size,
            entity2.size
          )
        ) {
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
  },
}) {
  /**
   * https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection#circle_collision
   */
  static readonly checkCollision = (
    pos1: Position,
    pos2: Position,
    size1: Size,
    size2: Size
  ): boolean => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < size1.size + size2.size;
  };
}

let countCycles = 0;
export class TargetSystem extends SystemFactory<{ followDelayCycles?: number }>(
  "Target",
  {
    execute: ({ world, input: { followDelayCycles = 10 } }) => {
      if (countCycles > followDelayCycles) {
        countCycles = 0;

        follow(world).forEach(({ position, followTarget }) => {
          followTarget.x = position.x;
          followTarget.y = position.y;
        });
      } else {
        countCycles++;
      }
    },
  }
) {}

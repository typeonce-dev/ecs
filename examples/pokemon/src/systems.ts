import { query, queryRequired, type System } from "@typeonce/ecs";
import { Collidable, Movement, Player, Position, Sprite } from "./components";
import { TILE_SIZE } from "./constants";
import { type GameEventMap } from "./events";
import type { InputManager } from "./input-manager";

export type SystemTags =
  | "Movement"
  | "PostMovement"
  | "Render"
  | "Input"
  | "Collision"
  | "ApplyMovement";

const moving = query({ position: Position, movement: Movement });
const pixiRender = query({ position: Position, sprite: Sprite });
const collisions = query({ position: Position, collidable: Collidable });
const playerQuery = queryRequired({ movement: Movement, player: Player });

export const MovementSystem: System<GameEventMap, SystemTags> = {
  _tag: "Movement",
  execute: ({ world }) => {
    moving(world).forEach(({ position, movement }) => {
      if (!movement.isMoving && movement.direction) {
        switch (movement.direction) {
          case "up":
            movement.targetX = position.x;
            movement.targetY = position.y - TILE_SIZE;
            break;
          case "down":
            movement.targetX = position.x;
            movement.targetY = position.y + TILE_SIZE;
            break;
          case "left":
            movement.targetX = position.x - TILE_SIZE;
            movement.targetY = position.y;
            break;
          case "right":
            movement.targetX = position.x + TILE_SIZE;
            movement.targetY = position.y;
            break;
        }
        movement.isMoving = true;
      }
    });
  },
};

export const ApplyMovementSystem: System<GameEventMap, SystemTags> = {
  _tag: "ApplyMovement",
  execute: ({ world, deltaTime }) => {
    moving(world).forEach(({ position, movement }) => {
      if (movement.isMoving) {
        const movementStep = movement.speed * deltaTime;

        const remainingDistanceX = movement.targetX - position.x;
        const remainingDistanceY = movement.targetY - position.y;

        if (
          Math.abs(remainingDistanceX) > movementStep ||
          Math.abs(remainingDistanceY) > movementStep
        ) {
          position.x +=
            Math.sign(remainingDistanceX) *
            Math.min(movementStep, Math.abs(remainingDistanceX));
          position.y +=
            Math.sign(remainingDistanceY) *
            Math.min(movementStep, Math.abs(remainingDistanceY));
        } else {
          position.x = movement.targetX;
          position.y = movement.targetY;

          movement.isMoving = false;
          movement.direction = null;
        }
      }
    });
  },
};

export const RenderSystem: System<GameEventMap, SystemTags> = {
  _tag: "Render",
  execute: ({ world }) => {
    pixiRender(world).forEach(({ position, sprite }) => {
      sprite.sprite.x = position.x;
      sprite.sprite.y = position.y;
    });
  },
};

export const InputSystem = (
  inputManager: InputManager
): System<GameEventMap, SystemTags> => ({
  _tag: "Input",
  execute: ({ world }) => {
    const { movement } = playerQuery(world)[0];
    if (inputManager.isKeyPressed("ArrowDown")) {
      movement.direction = "down";
    } else if (inputManager.isKeyPressed("ArrowUp")) {
      movement.direction = "up";
    } else if (inputManager.isKeyPressed("ArrowLeft")) {
      movement.direction = "left";
    } else if (inputManager.isKeyPressed("ArrowRight")) {
      movement.direction = "right";
    }
  },
});

export const CollisionSystem = (gridSize: {
  width: number;
  height: number;
}): System<GameEventMap, SystemTags> => ({
  _tag: "Collision",
  execute: ({ world }) => {
    const occupiedPositions = new Map<string, boolean>();

    collisions(world).forEach(({ position, collidable }) => {
      if (collidable.isSolid) {
        const key = `${position.x},${position.y}`;
        occupiedPositions.set(key, true);
      }
    });

    query({ movement: Movement })(world).forEach(({ movement }) => {
      const targetX = movement.targetX;
      const targetY = movement.targetY;

      const isOutOfBounds =
        targetX < 0 ||
        targetY < 0 ||
        targetX >= gridSize.width ||
        targetY >= gridSize.height;

      const targetKey = `${targetX},${targetY}`;
      if (isOutOfBounds || occupiedPositions.has(targetKey)) {
        movement.direction = null; // Stop movement
        movement.isMoving = false; // Ensure no movement happens
      }
    });
  },
});

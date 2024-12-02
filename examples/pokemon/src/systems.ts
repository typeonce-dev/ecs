import { query, queryRequired, type SystemUpdate } from "@typeonce/ecs";
import { Movement, Player, Position, Sprite } from "./components";
import { TILE_SIZE } from "./constants";
import { type GameEventMap } from "./events";
import type { InputManager } from "./input-manager";

const moving = query({ position: Position, movement: Movement });
const pixiRender = query({ position: Position, sprite: Sprite });
const playerQuery = queryRequired({ movement: Movement, player: Player });

export const MovementSystem: SystemUpdate<GameEventMap> = ({
  world,
  deltaTime,
}) => {
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

    // If the entity is in the process of moving, calculate its progress towards the target
    if (movement.isMoving) {
      // Calculate the movement speed in terms of grid units per frame
      const movementStep = movement.speed * deltaTime;

      // Determine the remaining distance to the target cell
      const remainingDistanceX = movement.targetX - position.x;
      const remainingDistanceY = movement.targetY - position.y;

      // Move the entity closer to the target position along each axis
      if (
        Math.abs(remainingDistanceX) > movementStep ||
        Math.abs(remainingDistanceY) > movementStep
      ) {
        // If still far from the target, move incrementally
        position.x +=
          Math.sign(remainingDistanceX) *
          Math.min(movementStep, Math.abs(remainingDistanceX));
        position.y +=
          Math.sign(remainingDistanceY) *
          Math.min(movementStep, Math.abs(remainingDistanceY));
      } else {
        // If close enough to the target, snap to the target cell
        position.x = movement.targetX;
        position.y = movement.targetY;

        // Mark movement as completed
        movement.isMoving = false;
        movement.direction = null; // Clear the direction as the movement is finished
      }
    }
  });
};

export const RenderSystem: SystemUpdate<GameEventMap> = ({ world }) => {
  pixiRender(world).forEach(({ position, sprite }) => {
    sprite.sprite.x = position.x;
    sprite.sprite.y = position.y;
  });
};

export const InputSystem =
  (inputManager: InputManager): SystemUpdate<GameEventMap> =>
  ({ world }) => {
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
  };

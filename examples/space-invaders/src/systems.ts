import { query, queryRequired, type SystemUpdate } from "@typeonce/ecs";
import * as Matter from "matter-js";

import { Collider, Player, Position, Sprite, Velocity } from "./components";
import type { InputManager } from "./input-manager";

const moving = query({ position: Position, velocity: Velocity });
const physics = query({ position: Position, collider: Collider });
const pixiRender = query({ position: Position, sprite: Sprite });
const player = queryRequired({ player: Player, velocity: Velocity });

export const MovementSystem: SystemUpdate = ({ world, deltaTime }) => {
  moving(world).forEach(({ position, velocity }) => {
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  });
};

export const PlayerInputSystem =
  (inputManager: InputManager): SystemUpdate =>
  ({ world }) => {
    const { velocity } = player(world)[0];
    if (inputManager.isKeyPressed("ArrowLeft")) {
      velocity.vx = -velocity.speed;
    } else if (inputManager.isKeyPressed("ArrowRight")) {
      velocity.vx = velocity.speed;
    } else {
      velocity.vx = 0;
    }
  };

export const RenderSystem: SystemUpdate = ({ world }) => {
  pixiRender(world).forEach(({ position, sprite }) => {
    sprite.sprite.x = position.x;
    sprite.sprite.y = position.y;
  });
};

export const PhysicsSystem =
  (engine: Matter.Engine): SystemUpdate =>
  ({ world }) => {
    Matter.Engine.update(engine);
    physics(world).forEach(({ position, collider }) => {
      collider.body.position.x = position.x;
      collider.body.position.y = position.y;
    });
  };

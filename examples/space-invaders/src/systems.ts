import { query, type SystemUpdate } from "@typeonce/ecs";
import * as Matter from "matter-js";

import { Collider, Position, Sprite, Velocity } from "./components";

const moving = query({ position: Position, velocity: Velocity });
const physics = query({ position: Position, collider: Collider });
const pixiRender = query({ position: Position, sprite: Sprite });

export const MovementSystem: SystemUpdate = ({ world, deltaTime }) => {
  moving(world).forEach(({ position, velocity }) => {
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  });
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
      position.x = collider.body.position.x;
      position.y = collider.body.position.y;
    });
  };

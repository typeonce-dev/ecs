import { query, type SystemUpdate } from "@typeonce/ecs";

import { Position, Velocity } from "../components";
import type { GameEventMap } from "../events";

const moving = query({ position: Position, velocity: Velocity });

export const MovementSystem: SystemUpdate<GameEventMap> = ({
  world,
  deltaTime,
}) => {
  moving(world).forEach(({ position, velocity }) => {
    position.x += velocity.dx * velocity.speed * deltaTime;
    position.y += velocity.dy * velocity.speed * deltaTime;
  });
};

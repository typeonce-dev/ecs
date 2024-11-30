import { getComponentRequired, query, type SystemUpdate } from "@typeonce/ecs";

import { FollowTarget, Position, SnakeBody } from "../components";
import type { GameEventMap } from "../events";

const interpolate2DWithDeltaTime = (
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

export const FollowSystem: SystemUpdate<GameEventMap> =
  (world) =>
  ({ deltaTime }) => {
    query({ position: Position, snakeBody: SnakeBody })(world).forEach(
      ({ position, snakeBody }) => {
        const { followTarget } = getComponentRequired({
          followTarget: FollowTarget,
        })(snakeBody.parentSegment)(world);

        const targetPosition = interpolate2DWithDeltaTime(
          position,
          followTarget,
          deltaTime,
          0.1
        );

        position.x = targetPosition.x;
        position.y = targetPosition.y;
      }
    );
  };

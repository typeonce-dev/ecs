import type { System, World } from "@typeonce/ecs";

import { FollowTargetComponent } from "../components/follow-target";
import { PositionComponent } from "../components/position";
import { SnakeBodyComponent } from "../components/snake-body";
import type { GameEventMap } from "../events";

export class FollowSystem<T extends GameEventMap> implements System<T> {
  constructor(private world: World<T>) {}

  update(deltaTime: number) {
    const entities = this.world.getEntitiesWithComponent({
      position: PositionComponent,
      snakeBody: SnakeBodyComponent,
    });

    for (let entityId = 0; entityId < entities.length; entityId++) {
      const position = entities[entityId]!.position;
      const snakeBody = entities[entityId]!.snakeBody;

      const { followTarget } = this.world.getComponentRequired(
        snakeBody.parentSegment,
        { followTarget: FollowTargetComponent }
      );

      const targetPosition = this.interpolate2DWithDeltaTime(
        position,
        followTarget,
        deltaTime,
        0.1
      );

      position.x = targetPosition.x;
      position.y = targetPosition.y;
    }
  }

  private interpolate2DWithDeltaTime(
    current: { x: number; y: number },
    target: { x: number; y: number },
    deltaTime: number,
    speed: number
  ): { x: number; y: number } {
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
  }
}

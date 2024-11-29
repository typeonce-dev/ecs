import type { System, World } from "@typeonce/ecs";

import { FollowTargetComponent } from "../components/follow-target";
import { PositionComponent } from "../components/position";
import type { GameEventMap } from "../events";

export class TargetSystem<T extends GameEventMap> implements System<T> {
  constructor(
    private world: World<T>,
    private readonly followDelayCycles = 10
  ) {}

  private countCycles = 0;

  update() {
    if (this.countCycles > this.followDelayCycles) {
      this.countCycles = 0;

      const entities = this.world.getEntitiesWithComponent({
        position: PositionComponent,
        followTarget: FollowTargetComponent,
      });

      for (let entityId = 0; entityId < entities.length; entityId++) {
        const position = entities[entityId]!.position;
        const followTarget = entities[entityId]!.followTarget;

        followTarget.x = position.x;
        followTarget.y = position.y;
      }
    } else {
      this.countCycles++;
    }
  }
}

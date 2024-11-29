import type { System, World } from "@typeonce/ecs";

import { PositionComponent } from "../components/position";
import { VelocityComponent } from "../components/velocity";
import type { GameEventMap } from "../events";

export class MovementSystem<T extends GameEventMap> implements System<T> {
  constructor(private world: World<T>) {}

  update(deltaTime: number) {
    const entities = this.world.getEntitiesWithComponent({
      position: PositionComponent,
      velocity: VelocityComponent,
    });

    for (let entityId = 0; entityId < entities.length; entityId++) {
      const position = entities[entityId]!.position;
      const velocity = entities[entityId]!.velocity;

      position.x += velocity.dx * velocity.speed * deltaTime;
      position.y += velocity.dy * velocity.speed * deltaTime;
    }
  }
}

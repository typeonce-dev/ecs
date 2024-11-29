import type { System, World } from "@typeonce/ecs";

import { PositionComponent } from "../components/position";
import { FoodEatenEvent, type GameEventMap } from "../events";
import { spawnFood } from "../utils";

export class FoodSpawnSystem<T extends GameEventMap> implements System<T> {
  constructor(
    private world: World<T>,
    private width: number,
    private height: number
  ) {}

  postUpdate() {
    this.world.pollEvents(FoodEatenEvent).forEach((event) => {
      this.world.destroyEntity(event.data.entityId);
      spawnFood(this.world)(
        new PositionComponent(
          Math.random() * this.width,
          Math.random() * this.height
        )
      );
    });
  }
}

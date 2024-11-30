import { destroyEntity } from "@typeonce/ecs";

import type { SystemEvent } from "@typeonce/ecs";
import { Position } from "../components";
import { FoodEatenEvent, type GameEventMap } from "../events";
import { spawnFood } from "../utils";

export const FoodSpawnSystem =
  ({
    height,
    width,
  }: {
    width: number;
    height: number;
  }): SystemEvent<GameEventMap> =>
  (world) =>
  ({ poll }) => {
    poll(FoodEatenEvent).forEach((event) => {
      destroyEntity(event.data.entityId)(world);
      spawnFood(world)(
        new Position({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 10, // Issue: repeated!
        })
      );
    });
  };

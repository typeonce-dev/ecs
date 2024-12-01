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
  ({ poll, destroyEntity, createEntity, addComponent }) => {
    poll(FoodEatenEvent).forEach((event) => {
      destroyEntity(event.data.entityId);
      addComponent(
        createEntity(),
        ...spawnFood(
          new Position({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 10, // Issue: repeated!
          })
        )
      );
    });
  };

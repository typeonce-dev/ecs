import type { World } from "@typeonce/ecs";
import { CollidableComponent } from "./components/collidable";
import { FoodComponent } from "./components/food";
import type { PositionComponent } from "./components/position";
import { RenderableComponent } from "./components/renderable";
import type { GameEventMap } from "./events";

export const spawnFood =
  (world: World<GameEventMap>) => (position: PositionComponent) => {
    const food = world.createEntity();
    world.addComponent(
      food,
      position,
      new FoodComponent(10),
      new CollidableComponent("food"),
      new RenderableComponent("#D80032")
    );
    return food;
  };

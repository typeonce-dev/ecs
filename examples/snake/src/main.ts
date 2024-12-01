import { ECS, update } from "@typeonce/ecs";
import {
  Collidable,
  FollowTarget,
  Position,
  Renderable,
  Size,
  SnakeHead,
  Velocity,
} from "./components";
import type { GameEventMap } from "./events";
import { InputManager } from "./input-manager";
import renderer from "./loop";
import { CollisionSystem } from "./systems/collision";
import { FollowSystem } from "./systems/follow";
import { FoodSpawnSystem } from "./systems/food-spawn";
import { MovementSystem } from "./systems/movement";
import { RenderSystem } from "./systems/render";
import { SnakeControllerSystem } from "./systems/snake-controller";
import { SnakeGrowSystem } from "./systems/snake-grow";
import { TargetSystem } from "./systems/target";
import { spawnFood } from "./utils";

const canvas = document.getElementById("canvas");
if (canvas && canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const inputManager = new InputManager();
    const world = ECS.create<GameEventMap>(
      ({
        addComponent,
        createEntity,
        registerSystemEvent,
        registerSystemUpdate,
      }) => {
        addComponent(
          createEntity(),
          new Size({ size: 10 }),
          new Position({
            x: ctx.canvas.width / 2,
            y: ctx.canvas.height / 2,
          }),
          new SnakeHead(),
          new Collidable({ entity: "snake" }),
          new Renderable({ color: "#2B2D42" }),
          new Velocity({ dx: 0, dy: -1, speed: 0.1 }),
          new FollowTarget({ x: 0, y: 0 })
        );

        addComponent(
          createEntity(),
          ...spawnFood(new Position({ x: 200, y: 100 }))
        );

        registerSystemUpdate(
          CollisionSystem,
          MovementSystem,
          FollowSystem,
          TargetSystem(),
          RenderSystem(ctx),
          SnakeControllerSystem(inputManager)
        );

        registerSystemEvent(
          SnakeGrowSystem,
          FoodSpawnSystem({
            width: ctx.canvas.width,
            height: ctx.canvas.height,
          })
        );
      }
    );

    renderer(update(world));
  } else {
    console.error("Canvas context not found");
  }
} else {
  console.error("Canvas not found");
}

import { ECS } from "@typeonce/ecs";
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
import {
  CollisionSystem,
  FollowSystem,
  FoodSpawnSystem,
  MovementSystem,
  RenderSystem,
  SnakeControllerSystem,
  SnakeGrowSystem,
  TargetSystem,
  type SystemTags,
} from "./systems";
import { spawnFood } from "./utils";

const canvas = document.getElementById("canvas");
if (canvas && canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const inputManager = new InputManager();
    const world = ECS.create<SystemTags, GameEventMap>(
      ({ addComponent, createEntity, addSystem }) => {
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

        addSystem(
          new SnakeGrowSystem(),
          new CollisionSystem(),
          new MovementSystem(),
          new FollowSystem(),
          new TargetSystem({ followDelayCycles: undefined }),
          new RenderSystem({ ctx }),
          new SnakeControllerSystem({ inputManager }),
          new FoodSpawnSystem({
            width: ctx.canvas.width,
            height: ctx.canvas.height,
          })
        );
      }
    );

    renderer(world.update);
  } else {
    console.error("Canvas context not found");
  }
} else {
  console.error("Canvas not found");
}

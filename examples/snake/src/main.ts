import { ECS } from "@typeonce/ecs";
import { CollidableComponent } from "./components/collidable";
import { FollowTargetComponent } from "./components/follow-target";
import { PositionComponent } from "./components/position";
import { RenderableComponent } from "./components/renderable";
import { SnakeHeadComponent } from "./components/snake-head";
import { VelocityComponent } from "./components/velocity";
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

const world = new ECS<GameEventMap>();
const inputManager = new InputManager();

const ctx = renderer(
  () => {},
  (deltaTime) => {
    world.update(deltaTime);
  }
)!;

const addFood = spawnFood(world);

world.addComponent(
  world.createEntity(),
  new PositionComponent(ctx.canvas.width / 2, ctx.canvas.height / 2),
  new SnakeHeadComponent(),
  new CollidableComponent("snake"),
  new RenderableComponent("#2B2D42"),
  new VelocityComponent(0, 1, 0.1),
  new FollowTargetComponent(0, 0)
);

addFood(new PositionComponent(200, 100));

world.registerSystem(
  new CollisionSystem(world),
  new MovementSystem(world),
  new SnakeGrowSystem(world),
  new FollowSystem(world),
  new TargetSystem(world),
  new RenderSystem(world, ctx),
  new FoodSpawnSystem(world, ctx.canvas.width, ctx.canvas.height),
  new SnakeControllerSystem(world, inputManager)
);

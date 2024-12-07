import { ECS } from "@typeonce/ecs";
import Matter, { Render } from "matter-js";
import * as PIXI from "pixi.js";
import { Collider, Player, Position, Sprite, Velocity } from "./components";
import {
  MAX_HEIGHT,
  MAX_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./constants";
import type { GameEventMap } from "./events";
import { InputManager } from "./input-manager";
import {
  EnemyBulletCollisionSystem,
  EnemyDescentSystem,
  EnemyDestroySystem,
  EnemySpawnSystem,
  MovementSystem,
  PhysicsSystem,
  PlayerInputSystem,
  RenderSystem,
  ShootingSystem,
  SystemTags,
} from "./systems";

const app = new PIXI.Application();
await app.init({
  width: MAX_WIDTH,
  height: MAX_HEIGHT,
  backgroundColor: 0x222222,
});
document.body.appendChild(app.canvas);

const inputManager = new InputManager();

const engine = Matter.Engine.create({
  gravity: { scale: 0 },
});
const render = Render.create({
  engine,
  element: document.body,
  options: {
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    wireframes: true,
  },
});

Render.run(render);

const world = ECS.create<SystemTags, GameEventMap>(
  ({ addSystem, createEntity, addComponent }) => {
    addSystem(
      new EnemyBulletCollisionSystem(),
      new EnemyDescentSystem(),
      new EnemyDestroySystem({ engine }),
      new EnemySpawnSystem({ app, engine }),
      new MovementSystem(),
      new PhysicsSystem({ engine }),
      new PlayerInputSystem({ inputManager }),
      new RenderSystem(),
      new ShootingSystem({ app, engine, inputManager })
    );

    const playerId = createEntity();
    const playerSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    playerSprite.width = PLAYER_WIDTH;
    playerSprite.height = PLAYER_HEIGHT;
    playerSprite.anchor.set(0.5, 0);
    app.stage.addChild(playerSprite);

    const initialPosition = Position.initial;
    const playerBody = Matter.Bodies.rectangle(
      initialPosition.x,
      initialPosition.y,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      { isSensor: true }
    );
    Matter.World.add(engine.world, playerBody);

    addComponent(
      playerId,
      Velocity.idle,
      initialPosition,
      new Player(),
      new Sprite({ sprite: playerSprite }),
      new Collider({ body: playerBody })
    );
  }
);

app.ticker.add(({ deltaTime }) => {
  world.update(deltaTime);
});

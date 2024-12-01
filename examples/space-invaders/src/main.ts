import { ECS, update } from "@typeonce/ecs";
import Matter from "matter-js";
import * as PIXI from "pixi.js";
import { Collider, Player, Position, Sprite, Velocity } from "./components";
import { PLAYER_HEIGHT, PLAYER_WIDTH } from "./constants";
import { InputManager } from "./input-manager";
import {
  MovementSystem,
  PhysicsSystem,
  PlayerInputSystem,
  RenderSystem,
  ShootingSystem,
} from "./systems";

const app = new PIXI.Application();
await app.init({ width: 800, height: 600, backgroundColor: 0x222222 });
document.body.appendChild(app.canvas);

const inputManager = new InputManager();
const engine = Matter.Engine.create();
const world = ECS.create(
  ({ registerSystemUpdate, createEntity, addComponent }) => {
    registerSystemUpdate(
      MovementSystem,
      RenderSystem,
      PhysicsSystem(engine),
      PlayerInputSystem(inputManager),
      ShootingSystem({ app, engine, inputManager })
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
      { isStatic: true }
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
  update(world)(deltaTime);
});

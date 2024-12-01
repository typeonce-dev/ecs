import { ECS, update } from "@typeonce/ecs";
import Matter from "matter-js";
import * as PIXI from "pixi.js";
import { Collider, Player, Position, Sprite, Velocity } from "./components";
import { InputManager } from "./input-manager";
import {
  MovementSystem,
  PhysicsSystem,
  PlayerInputSystem,
  RenderSystem,
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
      PlayerInputSystem(inputManager)
    );

    const playerId = createEntity();
    const playerSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    playerSprite.width = 40;
    playerSprite.height = 20;
    app.stage.addChild(playerSprite);

    const playerBody = Matter.Bodies.rectangle(400, 550, 40, 20, {
      isStatic: true,
    });
    Matter.World.add(engine.world, playerBody);

    addComponent(
      playerId,
      Velocity.init,
      new Position({ x: 400, y: 550 }),
      new Sprite({ sprite: playerSprite }),
      new Collider({ body: playerBody }),
      new Player()
    );
  }
);

app.ticker.add(({ deltaTime }) => {
  update(world)(deltaTime);
});

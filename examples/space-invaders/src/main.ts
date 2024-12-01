import { ECS, update } from "@typeonce/ecs";
import Matter from "matter-js";
import * as PIXI from "pixi.js";
import { Collider, Position, Sprite, Velocity } from "./components";
import { MovementSystem, PhysicsSystem, RenderSystem } from "./systems";

const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);

const engine = Matter.Engine.create();
const world = ECS.create(
  ({ registerSystemUpdate, createEntity, addComponent }) => {
    registerSystemUpdate(MovementSystem, RenderSystem, PhysicsSystem(engine));

    const playerId = createEntity();
    const playerSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    playerSprite.width = 40;
    playerSprite.height = 20;
    app.stage.addChild(playerSprite);

    const playerBody = Matter.Bodies.rectangle(400, 550, 40, 20, {
      isStatic: true,
    });
    Matter.World.add(engine.world, playerBody);

    addComponent(playerId, new Position({ x: 400, y: 550 }));
    addComponent(playerId, Velocity.init);
    addComponent(playerId, new Sprite({ sprite: playerSprite }));
    addComponent(playerId, new Collider({ body: playerBody }));
  }
);

app.ticker.add(({ deltaTime }) => {
  update(world)(deltaTime);
});

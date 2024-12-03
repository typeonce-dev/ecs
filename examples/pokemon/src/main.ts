import { ECS, update } from "@typeonce/ecs";
import * as PIXI from "pixi.js";
import { Movement, Player, Position, Sprite } from "./components";
import { TILE_SIZE } from "./constants";
import type { GameEventMap } from "./events";
import { InputManager } from "./input-manager";
import { InputSystem, MovementSystem, RenderSystem } from "./systems";

const app = new PIXI.Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x222222,
});
document.body.appendChild(app.canvas);

const grid = new PIXI.Graphics();
for (let i = 0; i < TILE_SIZE; i++) {
  grid.moveTo(i * TILE_SIZE, 0).lineTo(i * TILE_SIZE, 600);
}

for (let i = 0; i < TILE_SIZE; i++) {
  grid.moveTo(0, i * TILE_SIZE).lineTo(800, i * TILE_SIZE);
}

grid.stroke({ color: "#ffffff10", pixelLine: true });
app.stage.addChild(grid);

const inputManager = new InputManager();

const world = ECS.create<GameEventMap>(
  ({ registerSystemUpdate, createEntity, addComponent }) => {
    registerSystemUpdate(
      MovementSystem,
      RenderSystem,
      InputSystem(inputManager)
    );

    const playerId = createEntity();
    const playerSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    playerSprite.width = TILE_SIZE;
    playerSprite.height = TILE_SIZE;
    playerSprite.anchor.set(0.5, 0);
    app.stage.addChild(playerSprite);

    addComponent(
      playerId,
      new Player(),
      new Position({ x: TILE_SIZE * 7 - TILE_SIZE / 2, y: TILE_SIZE * 7 }),
      new Sprite({ sprite: playerSprite }),
      new Movement({
        direction: null,
        targetX: 0,
        targetY: 0,
        isMoving: false,
        speed: 3,
      })
    );
  }
);

app.ticker.add(({ deltaTime }) => {
  update(world)(deltaTime);
});

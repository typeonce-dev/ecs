import { query, queryRequired, type SystemUpdate } from "@typeonce/ecs";
import * as Matter from "matter-js";
import * as PIXI from "pixi.js";

import {
  Bullet,
  Collider,
  Player,
  Position,
  Sprite,
  Velocity,
} from "./components";
import type { InputManager } from "./input-manager";

const moving = query({ position: Position, velocity: Velocity });
const physics = query({ position: Position, collider: Collider });
const pixiRender = query({ position: Position, sprite: Sprite });
const playerVelocity = queryRequired({ player: Player, velocity: Velocity });
const playerPosition = queryRequired({ player: Player, position: Position });

export const MovementSystem: SystemUpdate = ({ world, deltaTime }) => {
  moving(world).forEach(({ position, velocity }) => {
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  });
};

export const PlayerInputSystem =
  (inputManager: InputManager): SystemUpdate =>
  ({ world }) => {
    const { velocity } = playerVelocity(world)[0];
    if (inputManager.isKeyPressed("ArrowLeft")) {
      velocity.vx = -velocity.speed;
    } else if (inputManager.isKeyPressed("ArrowRight")) {
      velocity.vx = velocity.speed;
    } else {
      velocity.vx = 0;
    }
  };

export const RenderSystem: SystemUpdate = ({ world }) => {
  pixiRender(world).forEach(({ position, sprite }) => {
    sprite.sprite.x = position.x;
    sprite.sprite.y = position.y;
  });
};

export const PhysicsSystem =
  (engine: Matter.Engine): SystemUpdate =>
  ({ world }) => {
    Matter.Engine.update(engine);
    physics(world).forEach(({ position, collider }) => {
      collider.body.position.x = position.x;
      collider.body.position.y = position.y;
    });
  };

export const ShootingSystem =
  ({
    app,
    engine,
    inputManager,
  }: {
    inputManager: InputManager;
    app: PIXI.Application;
    engine: Matter.Engine;
  }): SystemUpdate =>
  ({ world, addComponent, createEntity }) => {
    const { position } = playerPosition(world)[0];
    if (inputManager.isKeyPressed("Space")) {
      const bulletPosition = new Position({
        x: position.x,
        y: position.y + 10,
      });

      const bulletSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      bulletSprite.width = 5;
      bulletSprite.height = 10;
      bulletSprite.tint = 0xf5f5f5;
      bulletSprite.anchor.set(0.5, 1);
      bulletSprite.position.set(bulletPosition.x, bulletPosition.y);
      app.stage.addChild(bulletSprite);

      const bulletBody = Matter.Bodies.rectangle(
        bulletPosition.x,
        bulletPosition.y,
        5,
        10,
        { isSensor: true }
      );
      Matter.World.add(engine.world, bulletBody);

      addComponent(
        createEntity(),
        Bullet.default,
        bulletPosition,
        Velocity.shootUp,
        new Sprite({ sprite: bulletSprite }),
        new Collider({ body: bulletBody })
      );
    }
  };

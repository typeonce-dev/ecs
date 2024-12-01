import {
  query,
  queryRequired,
  type SystemEvent,
  type SystemUpdate,
} from "@typeonce/ecs";
import * as Matter from "matter-js";
import * as PIXI from "pixi.js";

import {
  Bullet,
  Collider,
  DescentPattern,
  Enemy,
  Player,
  Position,
  Sprite,
  Velocity,
} from "./components";
import { DestroyEnemy, type GameEventMap } from "./events";
import type { InputManager } from "./input-manager";

const moving = query({ position: Position, velocity: Velocity });
const physics = query({ position: Position, collider: Collider });
const pixiRender = query({ position: Position, sprite: Sprite });
const playerVelocity = queryRequired({ player: Player, velocity: Velocity });
const playerPosition = queryRequired({ player: Player, position: Position });
const bullets = queryRequired({ bullet: Bullet, collider: Collider });
const enemies = queryRequired({ enemy: Enemy, collider: Collider });
const descent = queryRequired({
  descentPattern: DescentPattern,
  position: Position,
});

export const MovementSystem: SystemUpdate<GameEventMap> = ({
  world,
  deltaTime,
}) => {
  moving(world).forEach(({ position, velocity }) => {
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  });
};

export const PlayerInputSystem =
  (inputManager: InputManager): SystemUpdate<GameEventMap> =>
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

export const RenderSystem: SystemUpdate<GameEventMap> = ({ world }) => {
  pixiRender(world).forEach(({ position, sprite }) => {
    sprite.sprite.x = position.x;
    sprite.sprite.y = position.y;
  });
};

export const EnemyDescentSystem = () => {
  let elapsedTime = 0;
  return (): SystemUpdate<GameEventMap> =>
    ({ world, deltaTime }) => {
      elapsedTime += deltaTime;
      descent(world).forEach(({ position, descentPattern }) => {
        const { dx, dy } = descentPattern.pattern(elapsedTime);
        position.x += dx * deltaTime;
        position.y += dy * deltaTime;
      });
    };
};

export const EnemyBulletCollisionSystem: SystemUpdate<GameEventMap> = ({
  world,
  emit,
}) => {
  const bulletsList = bullets(world);
  const enemiesList = enemies(world);
  for (const { collider: bulletCollider, entityId: bulletId } of bulletsList) {
    for (const { collider: enemyCollider, entityId: enemyId } of enemiesList) {
      if (
        Matter.Collision.collides(bulletCollider.body, enemyCollider.body)
          ?.collided ??
        false
      ) {
        emit({ type: DestroyEnemy, data: { bulletId, enemyId } });
      }
    }
  }
};

export const EnemyDestroySystem =
  (engine: Matter.Engine): SystemEvent<GameEventMap> =>
  ({ poll, destroyEntity, getComponentRequired }) => {
    poll(DestroyEnemy).forEach(({ data: { bulletId, enemyId } }) => {
      const bulletSprite = getComponentRequired({
        bullet: Bullet,
        collider: Collider,
        sprite: Sprite,
      })(bulletId);

      bulletSprite.sprite.sprite.destroy();
      Matter.World.remove(engine.world, bulletSprite.collider.body);
      destroyEntity(bulletId);

      const enemySprite = getComponentRequired({
        enemy: Enemy,
        collider: Collider,
        sprite: Sprite,
      })(bulletId);

      enemySprite.sprite.sprite.destroy();
      Matter.World.remove(engine.world, enemySprite.collider.body);
      destroyEntity(enemyId);
    });
  };

export const PhysicsSystem =
  (engine: Matter.Engine): SystemUpdate<GameEventMap> =>
  ({ world }) => {
    Matter.Engine.update(engine);
    physics(world).forEach(({ position, collider }) => {
      collider.body.position.x = position.x;
      collider.body.position.y = position.y;
    });
  };

export const ShootingSystem = ({
  app,
  engine,
  inputManager,
}: {
  inputManager: InputManager;
  app: PIXI.Application;
  engine: Matter.Engine;
}) => {
  let canShoot = true;
  let shootCooldown = 300;
  return (): SystemUpdate<GameEventMap> =>
    ({ world, addComponent, createEntity }) => {
      const { position } = playerPosition(world)[0];
      if (inputManager.isKeyPressed("Space") && canShoot) {
        canShoot = false;
        setTimeout(() => {
          canShoot = true;
        }, shootCooldown);

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
};

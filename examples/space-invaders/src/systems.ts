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
import { MAX_WIDTH } from "./constants";
import { DestroyEnemy, type GameEventMap } from "./events";
import type { InputManager } from "./input-manager";

const playerVelocity = queryRequired({ player: Player, velocity: Velocity });
const playerPosition = queryRequired({ player: Player, position: Position });

const moving = query({ position: Position, velocity: Velocity });
const physics = query({ position: Position, collider: Collider });
const pixiRender = query({ position: Position, sprite: Sprite });
const bullets = query({ bullet: Bullet, collider: Collider });
const enemies = query({ enemy: Enemy, collider: Collider });
const descent = query({ descentPattern: DescentPattern, position: Position });

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
        position.x = Math.min(
          MAX_WIDTH - 20,
          Math.max(20, position.x + dx * deltaTime)
        );
        position.y += dy * deltaTime;
      });
    };
};

export const EnemySpawnSystem = ({
  app,
  engine,
}: {
  app: PIXI.Application;
  engine: Matter.Engine;
}) => {
  let spawnCooldown = 100;
  let lastSpawnTime = Number.MAX_VALUE;
  return (): SystemUpdate<GameEventMap> =>
    ({ deltaTime, createEntity, addComponent }) => {
      lastSpawnTime += deltaTime;

      if (lastSpawnTime >= spawnCooldown) {
        lastSpawnTime = 0;

        const enemySprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        enemySprite.width = 40;
        enemySprite.height = 40;
        enemySprite.tint = 0x00ff00;
        enemySprite.anchor.set(0.5, 0.5); // Sync with engine
        enemySprite.position.set(Math.random() * (MAX_WIDTH - 100), 0);
        app.stage.addChild(enemySprite);

        const enemyBody = Matter.Bodies.rectangle(
          enemySprite.x,
          enemySprite.y,
          40,
          40,
          { isSensor: true }
        );
        Matter.World.add(engine.world, enemyBody);

        const rand = Math.random();
        addComponent(
          createEntity(),
          new Position({ x: enemySprite.x, y: enemySprite.y }),
          new Sprite({ sprite: enemySprite }),
          new Collider({ body: enemyBody }),
          new Enemy({ health: 3 }),
          rand < 0.15
            ? DescentPattern.zigZag
            : rand < 0.3
            ? DescentPattern.sin(Math.random() * 2 + 2, 0.1, 0.5)
            : rand < 0.45
            ? DescentPattern.oscillatingArc(Math.random() * 2 + 2, 0.05, 0.25)
            : rand < 0.6
            ? DescentPattern.spiral(Math.random() * 2 + 2, 0.05, 0.25)
            : DescentPattern.fastDown
        );
      }
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

      const enemySprite = getComponentRequired({
        enemy: Enemy,
        collider: Collider,
        sprite: Sprite,
      })(enemyId);

      bulletSprite.sprite.sprite.destroy();
      Matter.World.remove(engine.world, bulletSprite.collider.body);
      destroyEntity(bulletId);

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
          y: position.y - 10,
        });

        const bulletSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        bulletSprite.width = 5;
        bulletSprite.height = 10;
        bulletSprite.tint = 0xf5f5f5;
        bulletSprite.anchor.set(0.5, 0.5);
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

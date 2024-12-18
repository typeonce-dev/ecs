import { Component } from "@typeonce/ecs";
import { Body as _Body } from "matter-js";
import { Sprite as _Sprite } from "pixi.js";

export class Position extends Component("Position")<{
  x: number;
  y: number;
}> {
  static readonly initial = new this({ x: 400, y: 550 });
}

export class Collider extends Component("Collider")<{
  body: _Body;
}> {}

export class Sprite extends Component("Sprite")<{
  sprite: _Sprite;
}> {}

export class Velocity extends Component("Velocity")<{
  vx: number;
  vy: number;
  speed: number;
}> {
  static readonly idle = new this({ vx: 0, vy: 0, speed: 6 });
  static readonly shootUp = new this({ vx: 0, vy: -10, speed: 6 });
}

export class DescentPattern extends Component("DescentPattern")<{
  pattern: (time: number) => { dx: number; dy: number };
}> {
  static readonly sin = (amplitude: number, frequency: number, speed: number) =>
    new this({
      pattern: (time: number) => {
        const dx = Math.sin(time * frequency) * amplitude;
        const dy = speed;
        return { dx, dy };
      },
    });

  static readonly oscillatingArc = (
    amplitude: number,
    frequency: number,
    speed: number
  ) =>
    new this({
      pattern: (time) => {
        const dx = Math.cos(time * frequency) * amplitude;
        const dy = speed;
        return { dx, dy };
      },
    });

  static readonly zigZag = new this({
    pattern: (time: number) => ({
      dx: Math.sin(time * 0.05) > 0 ? 2 : -2,
      dy: 1,
    }),
  });

  static readonly fastDown = new this({
    pattern: (time: number) => ({ dx: 0, dy: 1 + time * 0.001 }),
  });

  static readonly spiral = (
    radiusStep: number,
    angularSpeed: number,
    speed: number
  ) =>
    new this({
      pattern: (time: number) => {
        const angle = time * angularSpeed;
        const dx = Math.cos(angle) * radiusStep;
        const dy = Math.sin(angle) * radiusStep + speed;
        return { dx, dy };
      },
    });
}

export class Bullet extends Component("Bullet")<{
  damage: number;
}> {
  static readonly default = new this({ damage: 10 });
}

export class Player extends Component("Player")<{}> {}

export class Enemy extends Component("Enemy")<{
  health: number;
}> {}

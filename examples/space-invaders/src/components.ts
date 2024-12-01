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

export class Bullet extends Component("Bullet")<{
  damage: number;
}> {
  static readonly default = new this({ damage: 10 });
}

export class Player extends Component("Player")<{}> {}

import { Component } from "@typeonce/ecs";
import { Body as _Body } from "matter-js";
import { Sprite as _Sprite } from "pixi.js";

export class Position extends Component("Position")<{
  x: number;
  y: number;
}> {}

export class Collider extends Component("Collider")<{
  body: _Body;
}> {}

export class Sprite extends Component("Sprite")<{
  sprite: _Sprite;
}> {}

export class Velocity extends Component("Velocity")<{
  vx: number;
  vy: number;
}> {
  static readonly init = new this({ vx: 0, vy: 0 });
}

export class Bullet extends Component("Bullet")<{}> {}

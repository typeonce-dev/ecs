import { Component } from "@typeonce/ecs";
import { Sprite as _Sprite } from "pixi.js";

export class Position extends Component("Position")<{
  x: number;
  y: number;
}> {}

export class Movement extends Component("Movement")<{
  direction: "up" | "down" | "left" | "right" | null;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  /** Tiles per second */
  speed: number;
}> {}

export class Sprite extends Component("Sprite")<{
  sprite: _Sprite;
}> {}

export class Player extends Component("Player")<{}> {}

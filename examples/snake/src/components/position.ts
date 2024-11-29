import type { Component } from "@typeonce/ecs";

export class PositionComponent implements Component {
  static readonly type = Symbol("Position");
  readonly type = PositionComponent.type;

  constructor(public x: number, public y: number, public size = 10) {}
}

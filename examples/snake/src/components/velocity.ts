import type { Component } from "@typeonce/ecs";

export class VelocityComponent implements Component {
  static readonly type = Symbol("Velocity");
  readonly type = VelocityComponent.type;

  constructor(
    public dx: -1 | 0 | 1,
    public dy: -1 | 0 | 1,
    public speed: number
  ) {}
}

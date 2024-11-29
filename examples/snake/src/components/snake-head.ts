import type { Component } from "@typeonce/ecs";

export class SnakeHeadComponent implements Component {
  static readonly type = Symbol("SnakeHead");
  readonly type = SnakeHeadComponent.type;

  constructor() {}
}

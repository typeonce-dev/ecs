import type { Component, EntityId } from "@typeonce/ecs";

export class SnakeBodyComponent implements Component {
  static readonly type = Symbol("SnakeBody");
  readonly type = SnakeBodyComponent.type;

  constructor(public parentSegment: EntityId, public isTail: boolean) {}
}

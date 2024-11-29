import type { Component } from "@typeonce/ecs";

export class CollidableComponent implements Component {
  static readonly type = Symbol("Collidable");
  readonly type = CollidableComponent.type;

  constructor(public entity: "snake" | "food" | "wall" | "tail") {}
}

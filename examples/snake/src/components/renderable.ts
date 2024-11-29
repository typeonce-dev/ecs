import type { Component } from "@typeonce/ecs";

export class RenderableComponent implements Component {
  static readonly type = Symbol("Renderable");
  readonly type = RenderableComponent.type;

  constructor(public color: `#${string}`) {}
}

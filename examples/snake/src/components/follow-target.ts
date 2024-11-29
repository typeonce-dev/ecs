import type { Component } from "@typeonce/ecs";

export class FollowTargetComponent implements Component {
  static readonly type = Symbol("FollowTarget");
  readonly type = FollowTargetComponent.type;

  constructor(public x: number, public y: number) {}
}

import type { Component } from "@typeonce/ecs";

export class FoodComponent implements Component {
  static readonly type = Symbol("Food");
  readonly type = FoodComponent.type;

  constructor(public value: number) {}
}

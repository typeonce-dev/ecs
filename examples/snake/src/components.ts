import { Component, type EntityId } from "@typeonce/ecs";

export class Collidable extends Component("Collidable")<{
  entity: "snake" | "food" | "wall" | "tail";
}> {}

export class FollowTarget extends Component("FollowTarget")<{
  x: number;
  y: number;
}> {}

export class Food extends Component("Food")<{
  value: number;
}> {}

export class Position extends Component("Position")<{
  x: number;
  y: number;
  size: number;
}> {}

export class Renderable extends Component("Renderable")<{
  color: `#${string}`;
}> {}

export class SnakeBody extends Component("SnakeBody")<{
  parentSegment: EntityId;
  isTail: boolean;
}> {}

export class SnakeHead extends Component("SnakeHead")<{}> {}

export class Velocity extends Component("Velocity")<{
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  speed: number;
}> {}

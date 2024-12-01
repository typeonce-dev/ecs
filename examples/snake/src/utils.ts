import {
  Collidable,
  Food,
  Renderable,
  Size,
  type Position,
} from "./components";

export const spawnFood = (position: Position) => [
  position,
  new Size({ size: 10 }),
  new Food({ value: 10 }),
  new Collidable({ entity: "food" }),
  new Renderable({ color: "#D80032" }),
];

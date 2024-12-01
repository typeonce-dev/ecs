import { Collidable, Food, Renderable, type Position } from "./components";

export const spawnFood = (position: Position) => [
  position,
  new Food({ value: 10 }),
  new Collidable({ entity: "food" }),
  new Renderable({ color: "#D80032" }),
];

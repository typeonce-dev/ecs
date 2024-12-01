import { query, type SystemUpdate } from "@typeonce/ecs";

import { Position, Renderable } from "../components";
import { type GameEventMap } from "../events";

const renderPosition = query({
  renderable: Renderable,
  position: Position,
});

export const RenderSystem =
  (ctx: CanvasRenderingContext2D): SystemUpdate<GameEventMap> =>
  ({ world }) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderPosition(world).forEach(({ renderable, position }) => {
      ctx.fillStyle = renderable.color;
      ctx.beginPath();
      ctx.arc(position.x, position.y, position.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

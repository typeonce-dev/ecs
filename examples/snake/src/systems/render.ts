import { query, type SystemUpdate } from "@typeonce/ecs";

import { Position, Renderable, Size } from "../components";
import { type GameEventMap } from "../events";

const renderPosition = query({
  renderable: Renderable,
  position: Position,
  size: Size,
});

export const RenderSystem =
  (ctx: CanvasRenderingContext2D): SystemUpdate<GameEventMap> =>
  ({ world }) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderPosition(world).forEach(({ renderable, position, size }) => {
      ctx.fillStyle = renderable.color;
      ctx.beginPath();
      ctx.arc(position.x, position.y, size.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

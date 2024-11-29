import { System, World } from "@typeonce/ecs";

import { PositionComponent } from "../components/position";
import { RenderableComponent } from "../components/renderable";
import { type GameEventMap } from "../events";

export class RenderSystem<T extends GameEventMap> implements System<T> {
  constructor(private world: World<T>, private ctx: CanvasRenderingContext2D) {}

  update() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    const entities = this.world.getEntitiesWithComponent({
      renderable: RenderableComponent,
      position: PositionComponent,
    });

    for (let entityId = 0; entityId < entities.length; entityId++) {
      const renderable = entities[entityId]!.renderable;
      const position = entities[entityId]!.position;

      this.ctx.fillStyle = renderable.color;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, position.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

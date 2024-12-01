import { query, type SystemUpdate } from "@typeonce/ecs";

import { FollowTarget, Position } from "../components";
import type { GameEventMap } from "../events";

const follow = query({
  position: Position,
  followTarget: FollowTarget,
});

let countCycles = 0;
export const TargetSystem =
  (followDelayCycles?: number): SystemUpdate<GameEventMap> =>
  ({ world }) => {
    if (countCycles > (followDelayCycles ?? 10)) {
      countCycles = 0;

      follow(world).forEach(({ position, followTarget }) => {
        followTarget.x = position.x;
        followTarget.y = position.y;
      });
    } else {
      countCycles++;
    }
  };

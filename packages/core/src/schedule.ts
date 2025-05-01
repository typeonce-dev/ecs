export const ScheduleTypeId = Symbol.for("ecs/Schedule");

export type ScheduleTypeId = typeof ScheduleTypeId;

export interface Schedule {
  readonly [ScheduleTypeId]: ScheduleTypeId;
}

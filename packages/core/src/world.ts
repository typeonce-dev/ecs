import { EventQueue } from "./queue";
import type {
  ComponentType,
  EntityId,
  EventMap,
  SystemEvent,
  SystemUpdate,
  World,
} from "./types";

export class ECS<T extends EventMap> implements World<T> {
  entities: Set<EntityId> = new Set();
  components: Map<EntityId, Map<string, ComponentType>> = new Map();
  nextEntityId: EntityId = 0;
  systemUpdates: SystemUpdate<T>[] = [];
  systemEvents: SystemEvent<T>[] = [];
  eventQueue: EventQueue<T> = new EventQueue<T>();
}

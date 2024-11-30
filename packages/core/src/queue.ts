import { Event, EventMap, EventType } from "./types";

export class EventQueue<T extends EventMap> {
  private events: Event<T, EventType<T>>[] = [];

  emit<E extends EventType<T>>(event: Event<T, E>): void {
    this.events.push(event);
  }

  poll<E extends EventType<T>>(eventType: E): Event<T, E>[] {
    return this.events.filter(
      (event): event is Event<T, E> => event.type === eventType
    );
  }

  clear(): void {
    this.events = [];
  }
}

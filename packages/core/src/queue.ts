import { Event, EventMap, EventType, type UniqueEvent } from "./types";

export class EventQueue<T extends EventMap> {
  private events: Event<T, EventType<T>>[] = [];
  private uniqueEvents: Map<EventType<T>, UniqueEvent<T, EventType<T>>> =
    new Map();

  emit<E extends EventType<T>>(event: Event<T, E>): void {
    this.events.push(event);
  }

  emitUnique<E extends EventType<T>>(event: UniqueEvent<T, E>): void {
    this.uniqueEvents.set(event.type, event);
  }

  poll<E extends EventType<T>>(
    eventType: E
  ): (Event<T, E> | UniqueEvent<T, E>)[] {
    const regularEvents = this.events.filter(
      (event): event is Event<T, E> => event.type === eventType
    );
    const uniqueEvent = this.uniqueEvents.get(eventType) as
      | UniqueEvent<T, E>
      | undefined;

    return uniqueEvent ? [...regularEvents, uniqueEvent] : regularEvents;
  }

  clear(): void {
    this.events = [];
    this.uniqueEvents.clear();
  }
}

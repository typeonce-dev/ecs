import type { EventQueue } from "./queue";

export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type EntityId = number;

export interface ComponentType {
  readonly _tag: string;
}

export interface ComponentClass<T extends ComponentType> {
  new (...args: any[]): Readonly<T>;
  readonly _tag: string;
}

export type ComponentClassMap = Record<string, ComponentClass<any>>;

export type ComponentInstanceMap<T extends ComponentClassMap> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export type SystemUpdate<T extends EventMap = {}> = (
  world: World<T>
) => (_: { deltaTime: number; emit: EventEmit<T> }) => void;

export type SystemEvent<T extends EventMap = {}> = (
  world: World<T>
) => (_: { deltaTime: number; poll: EventPoll<T> }) => void;

export type EventMap = {
  [K: symbol]: any;
};

type EventData<T extends EventMap, E extends EventType<T>> = T[E];
export type EventType<T extends EventMap> = keyof T & symbol;

export interface Event<T extends EventMap, E extends EventType<T>> {
  type: E;
  data: EventData<T, E>;
}

type EventEmit<T extends EventMap> = <E extends EventType<T>>(
  event: Event<T, E>
) => void;

type EventPoll<T extends EventMap> = <E extends EventType<T>>(
  eventType: E
) => Event<T, E>[];

export interface World<T extends EventMap> {
  entities: Set<EntityId>;
  components: Map<EntityId, Map<string, ComponentType>>;
  nextEntityId: EntityId;
  systemUpdates: SystemUpdate<T>[];
  systemEvents: SystemEvent<T>[];
  eventQueue: EventQueue<T>;
}

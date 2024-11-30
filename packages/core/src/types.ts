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

export interface System<_T extends EventMap> {
  update?: (deltaTime: number) => void;
  postUpdate?: (deltaTime: number) => void;
}

export type EventMap = {
  [K: symbol]: any;
};

type EventData<T extends EventMap, E extends EventType<T>> = T[E];
export type EventType<T extends EventMap> = keyof T & symbol;

export interface Event<T extends EventMap, E extends EventType<T>> {
  type: E;
  data: EventData<T, E>;
}

export interface World<T extends EventMap> {
  entities: Set<EntityId>;
  components: Map<EntityId, Map<string, ComponentType>>;
  nextEntityId: EntityId;
  systems: System<T>[];
  eventQueue: EventQueue<T>;
}

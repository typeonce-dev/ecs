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

type GetComponentRequired<T extends EventMap> = (
  world: World<T>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (entityId: EntityId) => { entityId: EntityId } & ComponentInstanceMap<M>;

type GetComponent<T extends EventMap> = (
  world: World<T>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (
  entityId: EntityId
) => ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined;

type AddComponent<T extends EventMap> = (
  world: World<T>
) => <T extends ComponentType>(
  entityId: EntityId,
  ...components: NoInfer<T>[]
) => void;

type RemoveComponent<T extends EventMap> = (
  world: World<T>
) => <T extends ComponentType>(
  entityId: EntityId,
  componentClass: ComponentClass<T>
) => void;

type RegisterSystemEvent<T extends EventMap> = (
  world: World<T>
) => (...systems: SystemEvent<T>[]) => void;

type RegisterSystemUpdate<T extends EventMap> = (
  world: World<T>
) => (...systems: SystemUpdate<T>[]) => void;

export type InitFunctions<T extends EventMap> = {
  addComponent: ReturnType<AddComponent<T>>;
  createEntity: () => EntityId;
  registerSystemEvent: ReturnType<RegisterSystemEvent<T>>;
  registerSystemUpdate: ReturnType<RegisterSystemUpdate<T>>;
};

type SystemFunctions<T extends EventMap> = InitFunctions<T> & {
  world: World<T>;
  deltaTime: number;
  getComponentRequired: ReturnType<GetComponentRequired<T>>;
  getComponent: ReturnType<GetComponent<T>>;
  removeComponent: ReturnType<RemoveComponent<T>>;
  destroyEntity: (entityId: EntityId) => void;
};

export type SystemUpdate<T extends EventMap = {}> = (
  _: SystemFunctions<T> & { emit: EventEmit<T> }
) => void;

export type SystemEvent<T extends EventMap = {}> = (
  _: SystemFunctions<T> & { poll: EventPoll<T> }
) => void;

export interface World<T extends EventMap> {
  entities: Set<EntityId>;
  components: Map<EntityId, Map<string, ComponentType>>;
  nextEntityId: EntityId;
  systemUpdates: SystemUpdate<T>[];
  systemEvents: SystemEvent<T>[];
}

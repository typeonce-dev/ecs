import type { SystemRegistry } from "./registry";

export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

const EntityIdTypeId: unique symbol = Symbol.for("ecs/EntityId");

export type EntityId = number & {
  readonly [EntityIdTypeId]: {
    readonly EntityId: "EntityId";
  };
};

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

type GetComponentRequired<T extends EventMap, Tag extends string> = (
  world: World<T, Tag>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (entityId: EntityId) => { entityId: EntityId } & ComponentInstanceMap<M>;

type GetComponent<T extends EventMap, Tag extends string> = (
  world: World<T, Tag>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (
  entityId: EntityId
) => ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined;

type AddComponent<T extends EventMap, Tag extends string> = (
  world: World<T, Tag>
) => <T extends ComponentType>(
  entityId: EntityId,
  ...components: NoInfer<T>[]
) => void;

type RemoveComponent<T extends EventMap, Tag extends string> = (
  world: World<T, Tag>
) => <T extends ComponentType>(
  entityId: EntityId,
  componentClass: ComponentClass<T>
) => void;

type AddSystem<T extends EventMap, Tag extends string> = (
  world: World<T, Tag>
) => (...systems: SystemDefinition<T, Tag>[]) => void;

export type InitFunctions<T extends EventMap, Tag extends string> = {
  addComponent: ReturnType<AddComponent<T, Tag>>;
  createEntity: () => EntityId;
  addSystem: ReturnType<AddSystem<T, Tag>>;
};

type SystemFunctions<T extends EventMap, Tag extends string> = InitFunctions<
  T,
  Tag
> & {
  world: World<T>;
  deltaTime: number;
  getComponentRequired: ReturnType<GetComponentRequired<T, Tag>>;
  getComponent: ReturnType<GetComponent<T, Tag>>;
  removeComponent: ReturnType<RemoveComponent<T, Tag>>;
  destroyEntity: (entityId: EntityId) => void;
};

export type SystemExecute<
  T extends EventMap,
  Tag extends string
> = InitFunctions<T, Tag> &
  SystemFunctions<T, Tag> & { emit: EventEmit<T>; poll: EventPoll<T> };

export type System<T extends EventMap = {}, Tag extends string = string> = {
  _tag: Tag;
  execute: (_: SystemExecute<T, Tag>) => void;
};

export type SystemDefinition<
  T extends EventMap = {},
  Tag extends string = string
> = System<T, Tag> & {
  dependencies?: Tag[];
};

export interface World<E extends EventMap, Tag extends string = string> {
  entities: Set<EntityId>;
  components: Map<EntityId, Map<string, ComponentType>>;
  nextEntityId: EntityId;
  registry: SystemRegistry<E, Tag>;

  update(deltaTime: number): void;
}

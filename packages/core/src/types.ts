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

type EventData<E extends EventMap, ET extends EventType<E>> = E[ET];
export type EventType<E extends EventMap> = keyof E & symbol;

export interface Event<E extends EventMap, ET extends EventType<E>> {
  type: ET;
  data: EventData<E, ET>;
}

type EventEmit<E extends EventMap> = <ET extends EventType<E>>(
  event: Event<E, ET>
) => void;

type EventPoll<E extends EventMap> = <ET extends EventType<E>>(
  eventType: ET
) => Event<E, ET>[];

type GetComponentRequired<Tag extends string, E extends EventMap> = (
  world: World<Tag, E>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (entityId: EntityId) => { entityId: EntityId } & ComponentInstanceMap<M>;

type GetComponent<Tag extends string, E extends EventMap> = (
  world: World<Tag, E>
) => <M extends ComponentClassMap>(
  componentMap: M
) => (
  entityId: EntityId
) => ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined;

type AddComponent<Tag extends string, E extends EventMap> = (
  world: World<Tag, E>
) => <T extends ComponentType>(
  entityId: EntityId,
  ...components: NoInfer<T>[]
) => void;

type RemoveComponent<Tag extends string, E extends EventMap> = (
  world: World<Tag, E>
) => <T extends ComponentType>(
  entityId: EntityId,
  componentClass: ComponentClass<T>
) => void;

type AddSystem<Tag extends string, E extends EventMap> = (
  world: World<Tag, E>
) => (...systems: SystemType<Tag, E, any>[]) => void;

export type InitFunctions<Tag extends string, E extends EventMap> = {
  addComponent: ReturnType<AddComponent<Tag, E>>;
  createEntity: () => EntityId;
  addSystem: ReturnType<AddSystem<Tag, E>>;
};

type SystemFunctions<Tag extends string, E extends EventMap> = InitFunctions<
  Tag,
  E
> & {
  world: World<Tag, E>;
  deltaTime: number;
  getComponentRequired: ReturnType<GetComponentRequired<Tag, E>>;
  getComponent: ReturnType<GetComponent<Tag, E>>;
  removeComponent: ReturnType<RemoveComponent<Tag, E>>;
  destroyEntity: (entityId: EntityId) => void;
};

export type SystemExecute<
  Tag extends string,
  E extends EventMap
> = InitFunctions<Tag, E> &
  SystemFunctions<Tag, E> & { emit: EventEmit<E>; poll: EventPoll<E> };

export type SystemType<
  Tag extends string,
  E extends EventMap,
  Exe extends SystemExecute<Tag, E>
> = {
  readonly _tag: Tag;
  readonly dependencies: Tag[];
  readonly execute: (_: Exe) => void;
};

export type AnySystem<Tag extends string, E extends EventMap> = SystemType<
  Tag,
  E,
  any
>;

export type Mutation =
  | { type: "addComponent"; entityId: EntityId; component: ComponentType }
  | { type: "removeComponent"; entityId: EntityId; component: ComponentType }
  | { type: "destroyEntity"; entityId: EntityId };

export interface World<Tag extends string, E extends EventMap> {
  entities: Set<EntityId>;
  components: Map<EntityId, Map<string, ComponentType>>;
  nextEntityId: EntityId;
  registry: SystemRegistry<Tag, E>;

  update(deltaTime: number): void;
}

export type EntityId = number;

export interface Component {
  // TODO: Make this "private" (or at least `_` prefix)
  readonly type: symbol;
}

export interface ComponentClass<T extends Component> {
  new (...args: any[]): T;
  readonly type: symbol;
}

export interface System<_T extends EventMap> {
  update?: (deltaTime: number) => void;
  postUpdate?: (deltaTime: number) => void;
}

export type EventMap = {
  [K: symbol]: any;
};

export type EventType<T extends EventMap> = keyof T & symbol;

export type EventData<T extends EventMap, E extends EventType<T>> = T[E];

export interface Event<T extends EventMap, E extends EventType<T>> {
  type: E;
  data: EventData<T, E>;
}

export interface UniqueEvent<T extends EventMap, E extends EventType<T>>
  extends Event<T, E> {
  _unique: true;
}

export type ComponentTuple<T extends ComponentClass<Component>[]> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export type ComponentClassMap = Record<string, ComponentClass<Component>>;

export type ComponentInstanceMap<T extends ComponentClassMap> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export interface World<T extends EventMap> {
  createEntity(): EntityId;
  destroyEntity(entityId: EntityId): void;

  addComponent<T extends Component>(
    entityId: EntityId,
    ...components: NoInfer<T>[]
  ): void;
  removeComponent<T extends Component>(
    entityId: EntityId,
    componentClass: ComponentClass<T>
  ): void;

  getEntitiesWithComponent<M extends ComponentClassMap>(
    componentMap: M
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>)[];
  getEntitiesWithComponentRequired<M extends ComponentClassMap>(
    componentMap: M
  ): [
    { entityId: EntityId } & ComponentInstanceMap<M>,
    ...({ entityId: EntityId } & ComponentInstanceMap<M>)[]
  ];
  getComponent<M extends ComponentClassMap>(
    entityId: EntityId,
    componentMap: M
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined;
  getComponentRequired<M extends ComponentClassMap>(
    entityId: EntityId,
    componentMap: M
  ): { entityId: EntityId } & ComponentInstanceMap<M>;

  registerSystem(...systems: System<T>[]): void;

  update(deltaTime: number): void;

  emitEvent<E extends EventType<T>>(event: Event<T, E>): void;
  pollEvents<E extends EventType<T>>(eventType: E): Event<T, E>[];
}

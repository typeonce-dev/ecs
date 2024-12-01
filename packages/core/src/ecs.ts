import type {
  ComponentClass,
  ComponentClassMap,
  ComponentInstanceMap,
  ComponentType,
  EntityId,
  Equals,
  Event,
  EventMap,
  EventType,
  InitFunctions,
  SystemEvent,
  SystemUpdate,
  World,
} from "./types";

export const Component = <Tag extends string>(
  tag: Tag
): {
  new <A extends Record<string, any> = {}>(
    args: Equals<A, {}> extends true
      ? void
      : {
          readonly [P in keyof A as P extends "_tag" ? never : P]: A[P];
        }
  ): { readonly _tag: Tag } & A;
  readonly _tag: Tag;
} => {
  class Base {
    readonly _tag = tag;
    constructor(args: any) {
      if (args) {
        Object.assign(this, args);
      }
    }
  }
  (Base.prototype as any).name = tag;
  (Base as any)._tag = tag;
  return Base as any;
};

const getComponentRequired =
  <T extends EventMap>(world: World<T>) =>
  <M extends ComponentClassMap>(componentMap: M) =>
  (entityId: EntityId): { entityId: EntityId } & ComponentInstanceMap<M> => {
    const entityComponents = world.components.get(entityId);
    if (entityComponents) {
      const matchedComponents: Partial<ComponentInstanceMap<M>> = {};
      let allMatched = true;

      for (const [key, componentClass] of Object.entries(componentMap)) {
        const component = entityComponents.get(componentClass._tag);
        if (component) {
          matchedComponents[key as keyof M] = component as InstanceType<
            M[keyof M]
          >;
        } else {
          allMatched = false;
          break;
        }
      }

      if (allMatched) {
        return {
          entityId,
          ...(matchedComponents as ComponentInstanceMap<M>),
        };
      } else {
        throw new Error(
          `Entity ${entityId} does not have all required components.`
        );
      }
    }

    throw new Error(`Components for entity ${entityId} not found`);
  };

const getComponent =
  <T extends EventMap>(world: World<T>) =>
  <M extends ComponentClassMap>(componentMap: M) =>
  (
    entityId: EntityId
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined => {
    try {
      return getComponentRequired(world)(componentMap)(entityId);
    } catch (error) {
      return undefined;
    }
  };

const addComponent =
  <T extends EventMap>(world: World<T>) =>
  <T extends ComponentType>(
    entityId: EntityId,
    ...components: NoInfer<T>[]
  ): void => {
    if (!world.components.has(entityId)) {
      world.components.set(entityId, new Map());
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i]!;
      world.components.get(entityId)!.set(component._tag, component);
    }
  };

const removeComponent =
  <T extends EventMap>(world: World<T>) =>
  <T extends ComponentType>(
    entityId: EntityId,
    componentClass: ComponentClass<T>
  ): void => {
    const entityComponents = world.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentClass._tag);
    }
  };

const createEntity =
  <T extends EventMap>(world: World<T>) =>
  (): EntityId => {
    const entityId = world.nextEntityId++ as EntityId;
    world.entities.add(entityId);
    return entityId;
  };

const destroyEntity =
  <T extends EventMap>(world: World<T>) =>
  (entityId: EntityId): void => {
    const wasDeleted = world.entities.delete(entityId);
    if (wasDeleted) {
      world.components.delete(entityId);
    }
  };

const emit =
  <T extends EventMap>(events: Event<T, EventType<T>>[]) =>
  <E extends EventType<T>>(event: Event<T, E>): void => {
    events.push(event);
  };

const poll =
  <T extends EventMap>(events: Event<T, EventType<T>>[]) =>
  <E extends EventType<T>>(eventType: E): Event<T, E>[] => {
    return events.filter(
      (event): event is Event<T, E> => event.type === eventType
    );
  };

const registerSystemUpdate =
  <T extends EventMap>(world: World<T>) =>
  (...systems: SystemUpdate<T>[]): void => {
    world.systemUpdates.push(...systems);
  };

const registerSystemEvent =
  <T extends EventMap>(world: World<T>) =>
  (...systems: SystemEvent<T>[]): void => {
    world.systemEvents.push(...systems);
  };

export const update =
  <T extends EventMap>(world: World<T>) =>
  (deltaTime: number): void => {
    const events: Event<T, EventType<T>>[] = [];

    for (const system of world.systemUpdates) {
      system({
        world,
        deltaTime,
        emit: emit(events),
        getComponentRequired: getComponentRequired(world),
        getComponent: getComponent(world),
        addComponent: addComponent(world),
        removeComponent: removeComponent(world),
        createEntity: createEntity(world),
        destroyEntity: destroyEntity(world),
        registerSystemEvent: registerSystemEvent(world),
        registerSystemUpdate: registerSystemUpdate(world),
      });
    }

    for (const system of world.systemEvents) {
      system({
        world,
        deltaTime,
        poll: poll(events),
        getComponentRequired: getComponentRequired(world),
        getComponent: getComponent(world),
        addComponent: addComponent(world),
        removeComponent: removeComponent(world),
        createEntity: createEntity(world),
        destroyEntity: destroyEntity(world),
        registerSystemEvent: registerSystemEvent(world),
        registerSystemUpdate: registerSystemUpdate(world),
      });
    }
  };

export const query =
  <M extends ComponentClassMap>(componentMap: M) =>
  <T extends EventMap>(
    world: World<T>
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>)[] => {
    const result: Array<{ entityId: EntityId } & ComponentInstanceMap<M>> = [];

    for (const entityId of world.entities) {
      const entity = getComponent(world)(componentMap)(entityId);
      if (entity) {
        result.push(entity);
      }
    }

    return result;
  };

export const queryRequired =
  <M extends ComponentClassMap>(componentMap: M) =>
  <T extends EventMap>(
    world: World<T>
  ): [
    { entityId: EntityId } & ComponentInstanceMap<M>,
    ...({ entityId: EntityId } & ComponentInstanceMap<M>)[]
  ] => {
    const result = query(componentMap)(world);

    if (result.length === 0) {
      throw new Error(
        `Missing at least one required entity with the following components: ${Object.keys(
          componentMap
        ).join(", ")}`
      );
    }

    return result as [
      { entityId: EntityId } & ComponentInstanceMap<M>,
      ...({ entityId: EntityId } & ComponentInstanceMap<M>)[]
    ];
  };

export class ECS<T extends EventMap> implements World<T> {
  static create<T extends EventMap>(
    init: (_: InitFunctions<T>) => void
  ): World<T> {
    const world = new ECS<T>();
    init({
      addComponent: addComponent(world),
      createEntity: createEntity(world),
      registerSystemEvent: registerSystemEvent(world),
      registerSystemUpdate: registerSystemUpdate(world),
    });
    return world;
  }

  entities: Set<EntityId> = new Set();
  components: Map<EntityId, Map<string, ComponentType>> = new Map();
  nextEntityId: EntityId = 0 as EntityId;
  systemUpdates: SystemUpdate<T>[] = [];
  systemEvents: SystemEvent<T>[] = [];
}

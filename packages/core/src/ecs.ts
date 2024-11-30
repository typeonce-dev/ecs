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

export const getComponentRequired =
  <M extends ComponentClassMap>(entityId: EntityId, componentMap: M) =>
  <T extends EventMap>(
    world: World<T>
  ): { entityId: EntityId } & ComponentInstanceMap<M> => {
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

export const getComponent =
  <M extends ComponentClassMap>(entityId: EntityId, componentMap: M) =>
  <T extends EventMap>(
    world: World<T>
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined => {
    try {
      return getComponentRequired(entityId, componentMap)(world);
    } catch (error) {
      return undefined;
    }
  };

export const query =
  <M extends ComponentClassMap>(componentMap: M) =>
  <T extends EventMap>(
    world: World<T>
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>)[] => {
    const result: Array<{ entityId: EntityId } & ComponentInstanceMap<M>> = [];

    for (const entityId of world.entities) {
      const entity = getComponent(entityId, componentMap)(world);
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

export const addComponent =
  <T extends ComponentType>(entityId: EntityId, ...components: NoInfer<T>[]) =>
  <T extends EventMap>(world: World<T>): World<T> => {
    if (!world.components.has(entityId)) {
      world.components.set(entityId, new Map());
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i]!;
      world.components.get(entityId)!.set(component._tag, component);
    }

    return world;
  };

export const removeComponent =
  <T extends ComponentType>(
    entityId: EntityId,
    componentClass: ComponentClass<T>
  ) =>
  <T extends EventMap>(world: World<T>): World<T> => {
    const entityComponents = world.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentClass._tag);
    }

    return world;
  };

export const createEntity =
  () =>
  <T extends EventMap>(world: World<T>): EntityId => {
    const entityId = world.nextEntityId++;
    world.entities.add(entityId);
    return entityId;
  };

export const destroyEntity =
  (entityId: EntityId) =>
  <T extends EventMap>(world: World<T>): void => {
    const wasDeleted = world.entities.delete(entityId);
    if (wasDeleted) {
      world.components.delete(entityId);
    }
  };

export const registerSystemUpdate =
  <T extends EventMap>(...systems: SystemUpdate<T>[]) =>
  (world: World<T>): World<T> => {
    world.systemUpdates.push(...systems);
    return world;
  };

export const registerSystemEvent =
  <T extends EventMap>(...systems: SystemEvent<T>[]) =>
  (world: World<T>): World<T> => {
    world.systemEvents.push(...systems);
    return world;
  };

const emit =
  <T extends EventMap>(world: World<T>) =>
  <E extends EventType<T>>(event: Event<T, E>): void => {
    world.eventQueue.emit(event);
  };

const poll =
  <T extends EventMap>(world: World<T>) =>
  <E extends EventType<T>>(eventType: E): Event<T, E>[] => {
    return world.eventQueue.poll(eventType);
  };

export const update =
  (deltaTime: number) =>
  <T extends EventMap>(world: World<T>): void => {
    for (const system of world.systemUpdates) {
      system(world)({ deltaTime, emit: emit(world) });
    }

    for (const system of world.systemEvents) {
      system(world)({ deltaTime, poll: poll(world) });
    }

    world.eventQueue.clear();
  };

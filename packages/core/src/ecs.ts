import { SystemRegistry } from "./registry";
import type {
  AnySystem,
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
  SystemExecute,
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

export const System: <T extends EventMap, Tag extends string>() => <
  A extends Record<string, any> = {}
>(
  tag: Tag,
  params: {
    execute: (_: SystemExecute<T, Tag> & { input: A }) => void;
    dependencies?: Tag[];
  }
) => {
  new (
    args: Equals<A, {}> extends true
      ? void
      : {
          readonly [P in keyof A as P extends "_tag" ? never : P]: A[P];
        }
  ): {
    readonly _tag: Tag;
    readonly execute: (_: SystemExecute<T, Tag> & { input: A }) => void;
    readonly dependencies: Tag[];
  } & A;
} =
  () =>
  (tag, { execute, dependencies = [] }) => {
    class Base {
      readonly _tag = tag;
      readonly dependencies = dependencies;
      readonly execute = (_: any) =>
        execute({
          ..._,
          input:
            // @ts-ignore
            this.input as any,
        });
      constructor(args: any) {
        if (args) {
          Object.assign(this, args);
          Object.defineProperty(this, "input", {
            get() {
              return args;
            },
          });
        }
      }
    }
    (Base.prototype as any).name = tag;
    (Base as any)._tag = tag;
    return Base as any;
  };

const getComponentRequired =
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
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
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
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
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
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
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
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
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
  (): EntityId => {
    const entityId = world.nextEntityId++ as EntityId;
    world.entities.add(entityId);
    return entityId;
  };

const destroyEntity =
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
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

const addSystem =
  <T extends EventMap, Tag extends string>(world: World<T, Tag>) =>
  (...systems: AnySystem<T, Tag>[]): void => {
    for (const system of systems) {
      world.registry.registerSystem(system);
    }
  };

export const query =
  <M extends ComponentClassMap, T extends ComponentType>(
    componentMap: M,
    notComponents?: ComponentClass<NoInfer<T>>[]
  ) =>
  <T extends EventMap, Tag extends string>(
    world: World<T, Tag>
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>)[] => {
    const result: Map<
      EntityId,
      { entityId: EntityId } & ComponentInstanceMap<M>
    > = new Map();
    const get = getComponent(world)(componentMap);

    for (const entityId of world.entities) {
      const entity = get(entityId);
      if (entity) {
        result.set(entityId, entity);
      }
    }

    if (notComponents) {
      const not = getComponent(world)(
        Object.fromEntries(
          notComponents.map((component) => [component._tag, component])
        )
      );

      for (const entityId of world.entities) {
        const entity = not(entityId);
        if (entity) {
          result.delete(entityId);
        }
      }
    }

    return Array.from(result.values());
  };

export const queryRequired =
  <M extends ComponentClassMap>(componentMap: M) =>
  <T extends EventMap, Tag extends string>(
    world: World<T, Tag>
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

export class ECS<E extends EventMap, Tag extends string = string>
  implements World<E, Tag>
{
  static create<T extends EventMap, Tag extends string = string>(
    init: (_: InitFunctions<T, Tag>) => void
  ): World<T> {
    const world = new ECS<T>();
    init({
      addComponent: addComponent(world),
      createEntity: createEntity(world),
      addSystem: addSystem(world),
    });
    return world;
  }

  registry: SystemRegistry<E, Tag> = new SystemRegistry();
  entities: Set<EntityId> = new Set();
  components: Map<EntityId, Map<string, ComponentType>> = new Map();
  nextEntityId: EntityId = 0 as EntityId;

  public update(deltaTime: number): void {
    const events: Event<E, EventType<E>>[] = [];
    this.registry.execute({
      world: this,
      deltaTime,
      getComponentRequired: getComponentRequired(this),
      getComponent: getComponent(this),
      addComponent: addComponent(this),
      removeComponent: removeComponent(this),
      createEntity: createEntity(this),
      destroyEntity: destroyEntity(this),
      addSystem: addSystem(this),
      poll: poll(events),
      emit: emit(events),
    });
  }
}

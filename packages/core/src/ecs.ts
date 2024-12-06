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
  Mutation,
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

export const System: <Tags extends string, E extends EventMap = {}>() => <
  A extends Record<string, any> = {}
>(
  tag: Tags,
  params: {
    execute: (_: SystemExecute<Tags, E> & { input: A }) => void;
    dependencies?: Tags[];
  }
) => {
  new (
    args: Equals<A, {}> extends true
      ? void
      : {
          readonly [P in keyof A as P extends "_tag" ? never : P]: A[P];
        }
  ): {
    readonly _tag: Tags;
    readonly execute: (_: SystemExecute<Tags, E> & { input: A }) => void;
    readonly dependencies: Tags[];
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
  <Tag extends string, E extends EventMap>(world: World<Tag, E>) =>
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
  <Tag extends string, E extends EventMap>(world: World<Tag, E>) =>
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
  <Tag extends string, E extends EventMap>(
    world: World<Tag, E>,
    mutations: Mutation[]
  ) =>
  <T extends ComponentType>(
    entityId: EntityId,
    ...components: NoInfer<T>[]
  ): void => {
    if (!world.components.has(entityId)) {
      world.components.set(entityId, new Map());
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i]!;
      mutations.push({ type: "addComponent", entityId, component });
    }
  };

const removeComponent =
  <Tag extends string, E extends EventMap>(
    world: World<Tag, E>,
    mutations: Mutation[]
  ) =>
  <T extends ComponentType>(
    entityId: EntityId,
    componentClass: ComponentClass<T>
  ): void => {
    const entityComponents = world.components.get(entityId);
    if (entityComponents) {
      mutations.push({
        type: "removeComponent",
        entityId,
        component: componentClass,
      });
    }
  };

const createEntity =
  <Tag extends string, E extends EventMap>(world: World<Tag, E>) =>
  (): EntityId => {
    const entityId = world.nextEntityId++ as EntityId;
    world.entities.add(entityId);
    return entityId;
  };

const destroyEntity =
  <Tag extends string, E extends EventMap>(
    world: World<Tag, E>,
    mutations: Mutation[]
  ) =>
  (entityId: EntityId): void => {
    const wasDeleted = world.entities.delete(entityId);
    if (wasDeleted) {
      mutations.push({ type: "destroyEntity", entityId });
    }
  };

const emit =
  <E extends EventMap>(events: Event<E, EventType<E>>[]) =>
  <ET extends EventType<E>>(event: Event<E, ET>): void => {
    events.push(event);
  };

const poll =
  <E extends EventMap>(events: Event<E, EventType<E>>[]) =>
  <ET extends EventType<E>>(eventType: ET): Event<E, ET>[] => {
    return events.filter(
      (event): event is Event<E, ET> => event.type === eventType
    );
  };

const addSystem =
  <Tag extends string, E extends EventMap>(world: World<Tag, E>) =>
  (...systems: AnySystem<Tag, E>[]): void => {
    for (const system of systems) {
      world.registry.registerSystem(system);
    }
  };

export const query =
  <M extends ComponentClassMap, T extends ComponentType>(
    componentMap: M,
    notComponents?: ComponentClass<NoInfer<T>>[]
  ) =>
  <Tag extends string, E extends EventMap>(
    world: World<Tag, E>
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
  <Tag extends string, E extends EventMap>(
    world: World<Tag, E>
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

export class ECS<Tags extends string = string, E extends EventMap = {}>
  implements World<Tags, E>
{
  static create<Tags extends string, E extends EventMap = {}>(
    init: (_: InitFunctions<Tags, E>) => void
  ): World<Tags, E> {
    const world = new ECS<Tags, E>();
    const mutations: Mutation[] = [];
    init({
      addComponent: addComponent(world, mutations),
      createEntity: createEntity(world),
      addSystem: addSystem(world),
    });
    world.applyMutations(mutations);
    return world;
  }

  registry: SystemRegistry<Tags, E> = new SystemRegistry();
  entities: Set<EntityId> = new Set();
  components: Map<EntityId, Map<string, ComponentType>> = new Map();
  nextEntityId: EntityId = 0 as EntityId;

  public update(deltaTime: number): void {
    const events: Event<E, EventType<E>>[] = [];
    const mutations: Mutation[] = [];
    this.registry.execute({
      world: this,
      deltaTime,
      getComponentRequired: getComponentRequired(this),
      getComponent: getComponent(this),
      createEntity: createEntity(this),

      addComponent: addComponent(this, mutations),
      removeComponent: removeComponent(this, mutations),
      destroyEntity: destroyEntity(this, mutations),

      addSystem: addSystem(this),

      poll: poll(events),
      emit: emit(events),
    });

    this.applyMutations(mutations);
  }

  private applyMutations(mutations: Mutation[]): void {
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i]!;
      switch (mutation.type) {
        case "addComponent":
          this.components
            .get(mutation.entityId)!
            .set(mutation.component._tag, mutation.component);
          break;
        case "removeComponent":
          this.components
            .get(mutation.entityId)!
            .delete(mutation.component._tag);
          break;
        case "destroyEntity":
          this.entities.delete(mutation.entityId);
          break;
      }
    }
  }
}

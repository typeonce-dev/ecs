import { EventQueue } from "./queue";
import type {
  Component,
  ComponentClass,
  ComponentClassMap,
  ComponentInstanceMap,
  EntityId,
  Event,
  EventMap,
  EventType,
  System,
  World,
} from "./types";

export class ECS<T extends EventMap> implements World<T> {
  private entities: Set<EntityId> = new Set();
  private components: Map<EntityId, Map<symbol, Component>> = new Map();
  private nextEntityId: EntityId = 0;
  private systems: System<T>[] = [];
  private eventQueue: EventQueue<T> = new EventQueue<T>();

  createEntity(): EntityId {
    const entityId = this.nextEntityId++;
    this.entities.add(entityId);
    return entityId;
  }

  addComponent<T extends Component>(
    entityId: EntityId,
    ...components: NoInfer<T>[]
  ): void {
    if (!this.components.has(entityId)) {
      this.components.set(entityId, new Map());
    }

    for (let i = 0; i < components.length; i++) {
      const component = components[i]!;
      this.components.get(entityId)!.set(component._tag, component);
    }
  }

  removeComponent<T extends Component>(
    entityId: EntityId,
    componentClass: ComponentClass<T>
  ): void {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentClass._tag);
    }
  }

  getComponentRequired<M extends ComponentClassMap>(
    entityId: EntityId,
    componentMap: M
  ): { entityId: EntityId } & ComponentInstanceMap<M> {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      const matchedComponents: Partial<ComponentInstanceMap<M>> = {};
      const unmatchedComponents: Partial<ComponentInstanceMap<M>> = {};

      for (const [key, componentClass] of Object.entries(componentMap)) {
        const component = entityComponents.get(componentClass._tag);
        if (component) {
          matchedComponents[key as keyof M] = component as InstanceType<
            M[keyof M]
          >;
        } else {
          unmatchedComponents[key as keyof M] = component as InstanceType<
            M[keyof M]
          >;
        }
      }

      if (Object.keys(unmatchedComponents).length === 0) {
        return {
          entityId,
          ...(matchedComponents as ComponentInstanceMap<M>),
        };
      } else {
        throw new Error(
          `Entity ${entityId} does not have all required components, the following components are missing: ${Object.keys(
            unmatchedComponents
          ).join(", ")}`
        );
      }
    }

    throw new Error(`Components for entity ${entityId} not found`);
  }

  getComponent<M extends ComponentClassMap>(
    entityId: EntityId,
    componentMap: M
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>) | undefined {
    try {
      return this.getComponentRequired(entityId, componentMap);
    } catch (error) {
      return undefined;
    }
  }

  getEntitiesWithComponent<M extends ComponentClassMap>(
    componentMap: M
  ): ({ entityId: EntityId } & ComponentInstanceMap<M>)[] {
    const result: Array<{ entityId: EntityId } & ComponentInstanceMap<M>> = [];

    for (const entityId of this.entities) {
      const entity = this.getComponent(entityId, componentMap);
      if (entity) {
        result.push(entity);
      }
    }

    return result;
  }

  getEntitiesWithComponentRequired<M extends ComponentClassMap>(
    componentMap: M
  ): [
      { entityId: EntityId } & ComponentInstanceMap<M>,
      ...({ entityId: EntityId } & ComponentInstanceMap<M>)[]
    ] {
    const result = this.getEntitiesWithComponent(componentMap);

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
  }

  registerSystem(...systems: System<T>[]): void {
    this.systems.push(...systems);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update?.(deltaTime);
    }

    for (const system of this.systems) {
      system.postUpdate?.(deltaTime);
    }

    this.clearEvents();
  }

  emitEvent<E extends EventType<T>>(event: Event<T, E>): void {
    this.eventQueue.emit(event);
  }

  pollEvents<E extends EventType<T>>(eventType: E): Event<T, E>[] {
    return this.eventQueue.poll(eventType);
  }

  destroyEntity(entityId: EntityId): void {
    const wasDeleted = this.entities.delete(entityId);
    if (wasDeleted) {
      this.components.delete(entityId);
    }
  }

  private clearEvents(): void {
    this.eventQueue.clear();
  }
}

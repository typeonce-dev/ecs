import type { AnySystem, EventMap, SystemExecute } from "./types";

export class SystemRegistry<
  T extends EventMap = {},
  Tag extends string = string
> {
  private systems: Map<Tag, AnySystem<T, Tag>> = new Map();
  private dependencies: Map<Tag, Set<Tag>> = new Map();

  registerSystem(system: AnySystem<T, Tag>) {
    this.systems.set(system._tag, system);
    this.dependencies.set(system._tag, new Set(system.dependencies));
  }

  private resolveExecutionOrder() {
    const order: Tag[] = [];
    const visited = new Set<Tag>();
    const stack = new Set<Tag>();

    const visit = (name: Tag) => {
      if (stack.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      if (visited.has(name)) return;

      stack.add(name);

      const system = this.systems.get(name);
      if (!system) throw new Error(`System not found: ${name}`);

      const dependencies = this.dependencies.get(name) ?? new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      visited.add(name);
      stack.delete(name);
      order.push(name);
    };

    for (const name of this.systems.keys()) {
      visit(name);
    }

    return order;
  }

  execute(params: SystemExecute<T, Tag>) {
    const sortedSystemNames = this.resolveExecutionOrder();
    for (const name of sortedSystemNames) {
      const system = this.systems.get(name);
      if (system) {
        system.execute(params);
      }
    }
  }
}

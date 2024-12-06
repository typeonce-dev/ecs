import type { AnySystem, EventMap, SystemExecute } from "./types";

export class SystemRegistry<Tags extends string, E extends EventMap = {}> {
  private systems: Map<Tags, AnySystem<Tags, E>> = new Map();
  private dependencies: Map<Tags, Set<Tags>> = new Map();

  registerSystem(system: AnySystem<Tags, E>) {
    this.systems.set(system._tag, system);
    this.dependencies.set(system._tag, new Set(system.dependencies));
  }

  private resolveExecutionOrder() {
    const order: Tags[] = [];
    const visited = new Set<Tags>();
    const stack = new Set<Tags>();

    const visit = (name: Tags) => {
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

  execute(params: SystemExecute<Tags, E>) {
    const sortedSystemNames = this.resolveExecutionOrder();
    for (const name of sortedSystemNames) {
      const system = this.systems.get(name);
      if (system) {
        system.execute(params);
      }
    }
  }
}

import * as Query from "./query.js";

export class SystemRegistry {
  private systems: Map<string, Query.TagInstance<string>> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();

  registerSystem<System extends Query.Tag<string, any, any, any>>(
    system: System
  ) {
    this.systems.set(system.key, system);
    this.dependencies.set(system.key, new Set(system.key));
  }

  private resolveExecutionOrder() {
    const order: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (name: string) => {
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

  execute(/** TODO */) {
    const sortedSystemNames = this.resolveExecutionOrder();
    for (const name of sortedSystemNames) {
      const system = this.systems.get(name);
      if (system) {
        system.execute(params);
      }
    }
  }
}

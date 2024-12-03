import type { EventMap, SystemExecute, SystemUpdate } from "./types";

type System<T extends EventMap = {}> = {
  name: string;
  execute: SystemUpdate<T>;
};

export class SystemRegistry<T extends EventMap = {}> {
  private systems: Map<string, System<T>> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();

  registerSystem(system: System<T>, dependsOn: string[] = []) {
    this.systems.set(system.name, system);
    this.dependencies.set(system.name, new Set(dependsOn));
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (systemName: string) => {
      if (visited.has(systemName)) return;
      visited.add(systemName);

      const deps = this.dependencies.get(systemName) || new Set();
      for (const dep of deps) {
        visit(dep);
      }

      result.unshift(systemName);
    };

    for (const systemName of this.systems.keys()) {
      visit(systemName);
    }

    return result;
  }

  execute(params: SystemExecute<T>) {
    const sortedSystemNames = this.topologicalSort();
    for (const name of sortedSystemNames) {
      const system = this.systems.get(name);
      if (system) {
        system.execute(params);
      }
    }
  }
}

import * as Query from "./query.js";

interface ECS {
  readonly systems: readonly Query.TagInstance<string, any, any>[];
}

export const create = (
  init: (params: {
    addSystem: (system: Query.TagInstance<string, any, any>) => void;
  }) => void
): ECS => {
  const systems: Query.TagInstance<string, any, any>[] = [];
  init({
    addSystem: (system) => {
      systems.push(system);
    },
  });

  return { systems } satisfies ECS;
};

export const execute = (ecs: ECS): void => {
  const systems: Map<string, Query.TagInstance<string, any, any>> = new Map();
  const dependencies: Map<string, Set<string>> = new Map();
  const events: Map<string, any> = new Map();

  for (const system of ecs.systems) {
    systems.set(system.key, system);
    dependencies.set(system.key, new Set(system.key));
  }

  const resolveExecutionOrder = () => {
    const order: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (name: string) => {
      if (stack.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      if (visited.has(name)) return;

      stack.add(name);

      const system = systems.get(name);
      if (!system) throw new Error(`System not found: ${name}`);

      const resolvedDependencies = dependencies.get(name) ?? new Set();
      for (const dep of resolvedDependencies) {
        visit(dep);
      }

      visited.add(name);
      stack.delete(name);
      order.push(name);
    };

    for (const name of systems.keys()) {
      visit(name);
    }

    return order;
  };

  const execute = (/** TODO */) => {
    const sortedSystemNames = resolveExecutionOrder();
    for (const name of sortedSystemNames) {
      const system = systems.get(name);
      if (system) {
        const event = system.execute(system.params);
        events.set(name, event);
      }
    }
  };

  return execute();
};

import type { Equals } from "./types.js";

export const ComponentTypeId = Symbol.for("ecs/Component");

export type ComponentTypeId = typeof ComponentTypeId;

export interface Component<Tag extends string> {
  readonly [ComponentTypeId]: ComponentTypeId;
  readonly _tag: Tag;
}

export namespace Component {
  export type Any = Component<string>;
}

export interface ComponentClass<T extends Component.Any> {
  new (...args: any[]): Readonly<T>;
  readonly _tag: string;
}

export type ComponentClassMap = Record<string, ComponentClass<any>>;

export type ComponentInstanceMap<T extends ComponentClassMap> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export const Component = <Tag extends string>(
  tag: Tag
): {
  new <A extends Record<string, any> = {}>(
    args: Equals<A, {}> extends true
      ? void
      : {
          readonly [P in keyof A as P extends "_tag" ? never : P]: A[P];
        }
  ): Component<Tag> & A;
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

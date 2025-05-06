import { describe, it } from "vitest";
import { App, Command, Component, System } from "../src/index";

describe("App", () => {
  it("creates an app", () => {
    class Position extends Component.Component("Position")<{ x: number }> {}
    class Size extends Component.Component("Size")<{ value: number }> {}

    const update = App.empty().pipe(
      App.addSystem(
        "Startup",
        System.make("Setup")(({ queue }) => {
          queue(
            Command.spawn(new Position({ x: 10 }), new Size({ value: 20 })),
            Command.spawn(new Position({ x: 10 }), new Size({ value: 20 }))
          );
        })
      ),
      App.update
    );

    update(1);
  });
});

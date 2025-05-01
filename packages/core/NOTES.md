# [Bevy](https://docs.rs/bevy/0.16.0/bevy/ecs/index.html)
Entry point called `App`, where you can chain calls to `add_systems`, and call `run` at the end.

[`Command`](https://docs.rs/bevy/latest/bevy/ecs/system/struct.Commands.html) used to perform action in the world (e.g. `spawn` a new entity with components).

Systems are divided in:
- `Startup`: runs once at the beginning
- [`Update`](https://docs.rs/bevy/latest/bevy/app/struct.Update.html): runs at every cycle
- [`FixedUpdate`](https://docs.rs/bevy/latest/bevy/prelude/struct.FixedUpdate.html): runs at a fixed rate rather than every render frame

[`Plugin`](https://bevyengine.org/learn/quick-start/getting-started/plugins/) add core features to the `App` setup ("groups systems").

`Resource` define "globally unique" data, separate from game entities.

Queries allow to define what to select (read/write) based on what's included and what not (e.g. `Query<&Position, (With<Player>, Without<Alive>)>`).

Events allow to communicate between systems (`EventWriter` and `EventReader`).

`Observers` are systems that listen for a “trigger” of a specific event.

`Schedule` defines dependencies between systems:
```rs
fn system_one() { println!("System 1 works!") }
fn system_two() { println!("System 2 works!") }
fn system_three() { println!("System 3 works!") }

fn main() {
    let mut world = World::new();
    let mut schedule = Schedule::default();
    schedule.add_systems((
        system_two,
        system_one.before(system_two),
        system_three.after(system_two),
    ));

    schedule.run(&mut world);
}
```

***

# Implementation
## [`App`](https://docs.rs/bevy/latest/bevy/prelude/struct.App.html)
`world`, `schedule`, and `runner`.

The `world` field stores all of our game's data, the `schedule` holds the systems that operate on this data (and the order in which they do so) and the `runner` interprets the schedule to control the broad execution strategy.

A single `App` containing different worlds.

> `runner` may not be needed, leaving the loop in user-land.

API:
- `addSystem(type: SystemType, system: System)`
- `run` (`update`)

### `SystemType`
- `Startup`: provides `Command` to execute one-time
- `Update`: at every frame
- `FixedUpdate`: at fixed time 

## `Query`
Retrieves entities with/without set of components.

## `Resource`
"Globally unique" data, separate from game entities.

## `Schedule`
Defines dependencies between systems.

## `EventWriter`/`EventReader`
Communication between systems.
export class InputManager {
  private keyStates: Map<string, boolean> = new Map();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keyStates.set(event.code, true);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keyStates.set(event.code, false);
  }

  public isKeyPressed(keyCode: "ArrowLeft" | "ArrowRight" | "Space"): boolean {
    return this.keyStates.get(keyCode) ?? false;
  }
}

let lastTime: number | null = null;

const update = (onUpdate: (delta: number) => void) => (time: number) => {
  if (lastTime !== null) {
    const delta = time - lastTime;
    onUpdate(delta);
  }

  lastTime = time;
  window.requestAnimationFrame(update(onUpdate));
};

export default function renderer(onUpdate: (delta: number) => void): void {
  window.requestAnimationFrame(update(onUpdate));
}

let lastTime: number | null = null;

const update = (onUpdate: (delta: number) => void) => (time: number) => {
  if (lastTime !== null) {
    const delta = time - lastTime;
    onUpdate(delta);
  }

  lastTime = time;
  window.requestAnimationFrame(update(onUpdate));
};

export default function renderer(
  onInit: (context: {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
  }) => void,
  onUpdate: (
    delta: number,
    context: {
      ctx: CanvasRenderingContext2D;
      canvas: HTMLCanvasElement;
    }
  ) => void,
  id = "canvas"
): CanvasRenderingContext2D | null {
  const canvas = document.getElementById(id);
  if (canvas && canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (ctx) {
      onInit({ canvas, ctx });
      window.requestAnimationFrame(
        update((delta) => onUpdate(delta, { canvas, ctx }))
      );

      return ctx;
    }
  }

  return null;
}

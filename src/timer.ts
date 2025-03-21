export interface Options {
  color: string,
  background: string,
  border: string,
  size: number
};

export interface Timer {
  start: (duration: number, callback: (() => any), started?: number) => void,
  options: Options,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
};

export const create = (elem: string, opts?: Options): Timer => {
  const presets: Options = {
    color: "#ff0000",
    background: "#8A8A8A",
    border: "#000",
    size: 1000,
  };

  const options = opts === undefined
    ? presets
    : { ...presets, ...opts };

  const canvas = document.createElement("canvas");
  canvas.width = options.size;
  canvas.height = options.size;

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Missing context for canvas.");
  }

  const element = <HTMLElement>document.querySelector(elem);

  if (!element) {
    throw new Error("No element to selector '" + elem + "'");
  }
  else {
    element.innerHTML = "";
    element.appendChild(canvas);
  }

  const start = (duration: number, callback: (() => any), started: number = -1): void => {
    if (started === -1) {
      drawTimer(1);
      requestAnimationFrame(() => start(duration, callback, +new Date()));
    } else {
      const elapsed = +new Date() - started;
      if (elapsed > duration) {
        drawTimer(0);
        callback();
      } else {
        drawTimer(elapsed / duration);
        requestAnimationFrame(() => start(duration, callback, started));
      }
    }
  };

  const drawTimer = (ratio: number) => {
    const center = options.size / 2;
    const fullCircle = Math.PI * 2;
    const radius = center - 2;

    ratio = ratio < 0
      ? 0
      : ratio > 1
        ? 1
        : ratio;

    context.fillStyle = options.color;
    context.beginPath();
    context.arc(center, center, radius, 0, fullCircle);
    context.fill();
    context.fillStyle = options.background;
    context.beginPath();
    context.moveTo(center, center);
    if (ratio !== 0) {
      context.arc(
        center,
        center,
        radius,
        -Math.PI / 2,
        ratio * fullCircle - Math.PI / 2,
        false
      );
    } else {
      context.arc(center, center, radius, 0, fullCircle);
    }
    context.fill();
    context.beginPath();
    context.lineWidth = 3;
    context.strokeStyle = options.border;
    context.arc(center, center, radius, 0, fullCircle);
    context.moveTo(center, center);
    context.arc(center, center, 1, 0, fullCircle);
    context.stroke();
  };

  return { start, options, canvas, context };
};

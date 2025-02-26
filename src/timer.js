import "./jquery.js";

export const createTimer = (elem, opts = {}) => {
  const presets = {
    color: "#ff0000",
    background: "#8A8A8A",
    border: "#000",
    size: 200,
  };

  if (!window.jQuery) {
    throw new Error("Timer needs jQuery to run!");
  }

  const options = { ...presets, ...opts };

  const canvas = $("<canvas>", {
    width: options.size,
    height: options.size,
  }).prop({ width: options.size, height: options.size });

  const context = canvas[0].getContext("2d");

  $(elem).width(options.size).height(options.size).empty().append(canvas);

  const start = (duration, callback, started = -1) => {
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

  const drawTimer = (ratio) => {
    const center = options.size / 2;
    const fullCircle = Math.PI * 2;
    const radius = center - 2;

    ratio = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;

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

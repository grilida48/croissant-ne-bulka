// Sample exposed pastry in the platter photo, away from the toppings and slate.
const patches = [
  [743, 466, 60, 38],
  [763, 501, 64, 38],
  [590, 542, 61, 61],
  [620, 701, 77, 47],
  [455, 570, 45, 77],
  [244, 745, 66, 42],
];
const size = 768;
const cell = 96;
const stamp = 144;

function canvas(width, height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  return surface.getContext('2d', { willReadFrequently: true });
}

function readPatch(photo, rect) {
  const context = canvas(stamp, stamp);
  context.drawImage(photo, ...rect, 0, 0, stamp, stamp);
  const sharp = context.getImageData(0, 0, stamp, stamp).data;
  context.filter = 'blur(6px)';
  context.drawImage(context.canvas, 0, 0);
  return { sharp, soft: context.getImageData(0, 0, stamp, stamp).data };
}

function grain(x, y, period) {
  const wrap = (coordinate) => coordinate & (period - 1);
  const hash = (i, j) => {
    const seed = Math.imul(wrap(i), 374761393) + Math.imul(wrap(j), 668265263);
    const mixed = Math.imul(seed ^ seed >>> 13, 1274126177);
    return ((mixed ^ mixed >>> 16) >>> 0) / 4294967295;
  };
  const i = Math.floor(x), j = Math.floor(y);
  const u = x - i, v = y - j;
  const horizontal = u * u * (3 - 2 * u);
  const vertical = v * v * (3 - 2 * v);
  const top = hash(i, j) * (1 - horizontal) + hash(i + 1, j) * horizontal;
  const bottom = hash(i, j + 1) * (1 - horizontal) + hash(i + 1, j + 1) * horizontal;
  return top * (1 - vertical) + bottom * vertical;
}

export function bakeCrustTexture(photo) {
  const inputs = patches.map((rect) => readPatch(photo, rect));
  const weighted = new Float32Array(size * size);
  const detail = new Float32Array(size * size);
  const overlap = stamp - cell;
  const fade = Float32Array.from({ length: stamp }, (_, i) =>
    Math.min(1, (i + .5) / overlap, (stamp - i - .5) / overlap));

  for (let row = 0; row < size / cell; row++) {
    for (let col = 0; col < size / cell; col++) {
      const pattern = (row * 73 + col * 29 + row * col * 13) % 97;
      const { sharp, soft } = inputs[pattern % inputs.length];
      for (let y = 0; y < stamp; y++) {
        const targetY = (row * cell + y) % size;
        for (let x = 0; x < stamp; x++) {
          const sourceX = pattern % 2 ? stamp - 1 - x : x;
          const sourceY = pattern % 3 ? y : stamp - 1 - y;
          const sourceIndex = (sourceY * stamp + sourceX) * 4;
          const targetX = (col * cell + x) % size;
          const targetIndex = targetY * size + targetX;
          const weight = fade[x] * fade[y];
          // Separate the surface detail from the light baked into the photo.
          const lift = (sharp[sourceIndex] - soft[sourceIndex]) * .32
            + (sharp[sourceIndex + 1] - soft[sourceIndex + 1]) * .55
            + (sharp[sourceIndex + 2] - soft[sourceIndex + 2]) * .13;
          detail[targetIndex] += weight * lift;
          weighted[targetIndex] += weight;
        }
      }
    }
  }

  const base = canvas(size, size);
  const basePixels = base.createImageData(size, size);
  for (let i = 0; i < detail.length; i++) {
    const relief = detail[i] / weighted[i];
    const index = i * 4;
    const height = 128 + relief * 2.5;
    basePixels.data[index] = height;
    basePixels.data[index + 1] = height;
    basePixels.data[index + 2] = height;
    basePixels.data[index + 3] = 255;
  }
  base.putImageData(basePixels, 0, 0);

  const resolution = 4096;
  const baked = canvas(resolution, resolution);
  baked.drawImage(base.canvas, 0, 0, resolution, resolution);
  const pixels = baked.getImageData(0, 0, resolution, resolution);
  // Add pores and flakes at native resolution, over the lower-frequency photo detail.
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = (y * resolution + x) * 4;
      const scale = .42 + .75 * grain(x / 16, y / 16, 256);
      const flake = grain(x / 4, y / 8, 1024) - .5;
      const pore = grain(x / 2, y / 2, 2048) - .5;
      const relief = scale * (flake * 16 + pore * 7);
      pixels.data[index] += relief;
      pixels.data[index + 1] += relief;
      pixels.data[index + 2] += relief;
    }
  }
  baked.putImageData(pixels, 0, 0);
  return baked.canvas;
}

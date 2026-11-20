import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

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

function makeTexture(context, anisotropy) {
  const texture = new CanvasTexture(context.canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = Math.min(8, anisotropy);
  return texture;
}

export function createCrustMaps(photo, anisotropy) {
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

  const diffuseContext = canvas(size, size);
  const surfaceContext = canvas(size, size);
  const diffuse = diffuseContext.createImageData(size, size);
  const surface = surfaceContext.createImageData(size, size);
  for (let i = 0; i < detail.length; i++) {
    const relief = detail[i] / weighted[i];
    const index = i * 4;
    const tone = 227 + relief * 1.65;
    diffuse.data[index] = tone + 5;
    diffuse.data[index + 1] = tone;
    diffuse.data[index + 2] = tone - 6;
    diffuse.data[index + 3] = 255;
    // Three reads height from red and roughness from green.
    surface.data[index] = 128 + relief * 2.5;
    surface.data[index + 1] = 146 + relief * 1.8;
    surface.data[index + 3] = 255;
  }
  diffuseContext.putImageData(diffuse, 0, 0);
  surfaceContext.putImageData(surface, 0, 0);
  const map = makeTexture(diffuseContext, anisotropy);
  map.colorSpace = SRGBColorSpace;
  return { map, surface: makeTexture(surfaceContext, anisotropy) };
}

import {
  BufferAttribute, BufferGeometry, Color, Mesh, MeshPhysicalMaterial,
} from 'three';

const along = 440;
const around = 112;
const edge = 1.9;
const twoPi = 2 * Math.PI;
const pale = new Color('#f6c66e');
const toasted = new Color('#854019');
const crust = new Color('#cc782e');

export function createCroissant() {
  const positions = [];
  const colors = [];
  const indices = [];
  const color = new Color();

  for (let row = 0; row <= along; row++) {
    const fraction = row / along;
    const t = (fraction * 2 - 1) * edge;
    const x = 1.87 * Math.sin(t);
    const z = 1.17 * (1 - Math.cos(t)) - .72;
    const dx = 1.87 * Math.cos(t);
    const dz = 1.17 * Math.sin(t);
    const length = Math.hypot(dx, dz);
    const taper = Math.pow(Math.max(.00001, 1 - Math.pow(Math.abs(t / edge), 1.65)), .67);
    const thickness = .86 * taper;

    for (let col = 0; col < around; col++) {
      const angle = col / around * twoPi;
      const vertical = Math.sin(angle);
      const horizontal = Math.cos(angle);
      const phase = fraction * 8.5 + .29 * horizontal + .13 * vertical
        + .075 * Math.sin(4 * angle + t * 10);
      const seam = phase - Math.floor(phase);
      const fold = Math.sin(Math.PI * seam);
      const groove = Math.exp(-Math.pow((seam - .045) / .045, 2));
      const lamination = Math.sin(twoPi * (seam * 6.4 + .08 * Math.sin(angle * 6 + t * 11)));
      const flakes = Math.sin(t * 137 + angle * 13) * Math.sin(t * 71 - angle * 27);
      const uneven = Math.sin(t * 21 + angle * 5) * Math.sin(t * 8 - angle * 8);
      const radius = thickness * (1 + .15 * fold - .065 * groove
        + .013 * lamination + .009 * flakes + .019 * uneven);
      const y = vertical * radius * .83 + .06 * Math.cos(t * 2) + .035 * Math.sin(t * 3);
      positions.push(x - dz / length * horizontal * radius, y, z + dx / length * horizontal * radius);

      color.copy(crust);
      color.lerp(pale, Math.max(0, .66 * groove + .2 * lamination + .12 * uneven));
      color.lerp(toasted, Math.max(0, .28 * vertical + .18 * fold + .15 * flakes - .25 * groove));
      colors.push(color.r, color.g, color.b);

      if (row < along) {
        const current = row * around + col;
        const next = row * around + (col + 1) % around;
        indices.push(current, current + around, next, next, current + around, next + around);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new Mesh(geometry, new MeshPhysicalMaterial({
    vertexColors: true, roughness: .63, clearcoat: .18, clearcoatRoughness: .49,
  }));
}

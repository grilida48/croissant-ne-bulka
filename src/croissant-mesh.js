import {
  BufferAttribute, BufferGeometry, Color, DodecahedronGeometry, Group, InstancedMesh,
  Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Vector3,
} from 'three';

const along = 480;
const around = 144;
const turn = 2 * Math.PI;
const pale = new Color('#ffcf77');
const toasted = new Color('#652207');
const crust = new Color('#c67423');
const smooth = (value) => value * value * (3 - 2 * value);
const lerp = (a, b, t) => a + (b - a) * t;

function grain(x, y, z) {
  const n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1446648773);
  const mixed = Math.imul(n ^ n >>> 13, 1274126177);
  return ((mixed ^ mixed >>> 16) >>> 0) / 4294967295;
}

function noise(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
  const u = smooth(x - i), v = smooth(y - j), w = smooth(z - k);
  const low = lerp(lerp(grain(i, j, k), grain(i + 1, j, k), u),
    lerp(grain(i, j + 1, k), grain(i + 1, j + 1, k), u), v);
  const high = lerp(lerp(grain(i, j, k + 1), grain(i + 1, j, k + 1), u),
    lerp(grain(i, j + 1, k + 1), grain(i + 1, j + 1, k + 1), u), v);
  return lerp(low, high, w);
}

function sample(fraction, angle, position, color) {
  const t = (fraction * 2 - 1) * 1.54;
  const vertical = Math.sin(angle);
  const horizontal = Math.cos(angle);
  const x = 1.72 * Math.sin(t);
  const z = .74 * (1 - Math.cos(t)) - .34 + .13 * Math.sin(t);
  const dx = 1.72 * Math.cos(t);
  const dz = .74 * Math.sin(t) + .13 * Math.cos(t);
  const length = Math.hypot(dx, dz);
  const taper = Math.pow(Math.max(.00001, 1 - Math.pow(Math.abs(t / 1.54), 1.45)), .73);
  const waves = noise(t * 12, horizontal * 3, vertical * 3);
  const bubbles = noise(t * 36, horizontal * 14, vertical * 13);
  const crumbs = noise(t * 92, horizontal * 40, vertical * 38);
  const skew = .27 * horizontal + .09 * vertical + .10 * (waves - .5);
  // The wide middle wrap narrows into more tightly wound layers at the tips.
  const center = fraction - .49;
  const phase = center * (4.9 + 14 * Math.abs(center)) + skew + .52;
  const seam = phase - Math.floor(phase);
  const lip = Math.exp(-Math.pow((seam - .88) / .10, 2));
  const groove = Math.exp(-Math.pow((Math.min(seam, 1 - seam)) / .047, 2));
  const layers = Math.sin(turn * (seam * (4.4 + waves) + waves * .28));
  const ridge = Math.pow(seam, 1.7) * smooth(Math.min(1, (1 - seam) / .09));
  const radius = 1.06 * taper * (1 + .074 * ridge + .044 * lip - .021 * groove
    + .006 * layers + .088 * (waves - .5) + .032 * (bubbles - .5)
    + .012 * (crumbs - .5));
  const underside = vertical < 0 ? .66 : .86;
  position.set(x - dz / length * horizontal * radius,
    vertical * radius * underside + .025 * Math.sin(t * 8),
    z + dx / length * horizontal * radius);

  if (color) {
    color.copy(crust);
    color.lerp(pale, Math.max(0, .28 * lip + .12 * layers * lip + .60 * bubbles + .23 * waves - .31));
    color.lerp(toasted, Math.max(0, .40 * groove + .17 * vertical + .53 * waves + .10 * crumbs - .29));
  }
}

export function createCroissant() {
  const columns = around + 1;
  const positions = new Float32Array((along + 1) * columns * 3);
  const colors = new Float32Array(positions.length);
  const uv = new Float32Array((along + 1) * columns * 2);
  const indices = [];
  const position = new Vector3();
  const color = new Color();
  for (let row = 0; row <= along; row++) {
    for (let col = 0; col < columns; col++) {
      const current = row * columns + col;
      const u = row / along;
      const v = col / around;
      sample(u, (col % around) / around * turn - Math.PI / 2, position, color);
      position.toArray(positions, current * 3);
      color.toArray(colors, current * 3);
      uv.set([u * 1.45 + .12 * Math.sin(v * turn), v * 2], current * 2);
      if (row === along || col === around) continue;
      const next = current + 1;
      indices.push(current, current + columns, next, next, current + columns, next + columns);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  const seamNormal = new Vector3();
  for (let row = 0; row <= along; row++) {
    const first = row * columns;
    const last = first + around;
    position.fromBufferAttribute(normals, first);
    seamNormal.fromBufferAttribute(normals, last).add(position).normalize();
    normals.setXYZ(first, seamNormal.x, seamNormal.y, seamNormal.z);
    normals.setXYZ(last, seamNormal.x, seamNormal.y, seamNormal.z);
  }
  const pastry = new Group();
  pastry.add(new Mesh(geometry, new MeshPhysicalMaterial({
    vertexColors: true, roughness: .57, clearcoat: .42, clearcoatRoughness: .29,
  })));
  pastry.add(scatterTopping(18, true), scatterTopping(25, false));
  return pastry;
}

function scatterTopping(count, chocolate) {
  const geometry = new DodecahedronGeometry(1, chocolate ? 1 : 0);
  const material = new MeshStandardMaterial({ roughness: chocolate ? .48 : .78 });
  const toppings = new InstancedMesh(geometry, material, count);
  const piece = new Object3D();
  const color = new Color();
  const dark = chocolate ? '#201008' : '#81431f';
  const light = chocolate ? '#59301d' : '#edbd70';
  const lightColor = new Color(light);
  const offset = chocolate ? 37 : 71;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const spread = Math.sqrt((i + .25) / count);
    const direction = i * goldenAngle + offset;
    const fraction = .51 + .135 * spread * Math.cos(direction);
    const angle = 1.21 + .52 * spread * Math.sin(direction) + .13 * spread * Math.cos(direction);
    const variation = grain(i, offset, 3);
    const size = (chocolate ? .087 : .063) * (.63 + variation * .73);
    sample(fraction, angle, piece.position);
    piece.position.y += size * .19;
    piece.rotation.set(grain(i, offset, 1), direction, grain(i, offset, 2) - .5);
    piece.scale.set(size * (.82 + variation * .34), size * .61, size);
    piece.updateMatrix();
    toppings.setMatrixAt(i, piece.matrix);
    toppings.setColorAt(i, color.set(dark).lerp(lightColor, variation));
  }
  return toppings;
}

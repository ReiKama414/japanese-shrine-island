import React, { useMemo } from 'react';
import * as THREE from 'three';
import { fbm2, noise2D, getTerrainHeight } from '../utils/noiseAndTerrain';

interface PineVegetationProps {
  foliageScale: number;
}

export const PineVegetation: React.FC<PineVegetationProps> = ({ foliageScale }) => {
  const { trunkGeom, foliageGeom } = useMemo(() => {
    const trunkPos: number[] = [];
    const trunkNorm: number[] = [];
    const trunkCol: number[] = [];
    const trunkIdx: number[] = [];
    let trunkVertOffset = 0;

    const foliagePos: number[] = [];
    const foliageNorm: number[] = [];
    const foliageCol: number[] = [];
    const foliageIdx: number[] = [];
    let foliageVertOffset = 0;

    const cBarkDark = new THREE.Color('#3b281e');
    const cBarkRed = new THREE.Color('#5c3a28');

    const pinePalette = [
      new THREE.Color('#132915'),
      new THREE.Color('#1b381d'),
      new THREE.Color('#244723'),
      new THREE.Color('#2f582b'),
      new THREE.Color('#3c6932'),
      new THREE.Color('#4c7b3b'),
      new THREE.Color('#5f8e46'),
      new THREE.Color('#709e52')
    ];

    const addBranchSegment = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      rBot: number,
      rTop: number,
      segs = 6
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dy, dz) || 0.001;
      const ux = dx / len;
      const uy = dy / len;
      const uz = dz / len;
      let ax = 0;
      let ay = 1;
      const az = 0;
      if (Math.abs(uy) > 0.9) {
        ax = 1;
        ay = 0;
      }
      let bx = uy * az - uz * ay;
      let by = uz * ax - ux * az;
      let bz = ux * ay - uy * ax;
      const bLen = Math.hypot(bx, by, bz) || 1;
      bx /= bLen;
      by /= bLen;
      bz /= bLen;
      const cx = uy * bz - uz * by;
      const cy = uz * bx - ux * bz;
      const cz = ux * by - uy * bx;

      const rings = 2;
      for (let iy = 0; iy <= rings; iy++) {
        const v = iy / rings;
        const r = rBot + (rTop - rBot) * v;
        const px0 = x1 + dx * v;
        const py0 = y1 + dy * v;
        const pz0 = z1 + dz * v;
        const col = cBarkDark.clone().lerp(cBarkRed, v * 0.7);

        for (let ix = 0; ix <= segs; ix++) {
          const theta = (ix / segs) * Math.PI * 2;
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);
          const nx = bx * cosT + cx * sinT;
          const ny = by * cosT + cy * sinT;
          const nz = bz * cosT + cz * sinT;
          trunkPos.push(px0 + nx * r, py0 + ny * r, pz0 + nz * r);
          trunkNorm.push(nx, ny, nz);
          trunkCol.push(col.r, col.g, col.b);
        }
      }

      for (let iy = 0; iy < rings; iy++) {
        for (let ix = 0; ix < segs; ix++) {
          const row1 = trunkVertOffset + iy * (segs + 1);
          const row2 = trunkVertOffset + (iy + 1) * (segs + 1);
          const a = row1 + ix;
          const b = row2 + ix;
          const c = row2 + ix + 1;
          const d = row1 + ix + 1;
          trunkIdx.push(a, b, d, b, c, d);
        }
      }
      trunkVertOffset += (rings + 1) * (segs + 1);
    };

    const baseSphere = new THREE.IcosahedronGeometry(1.0, 2);
    const bsPos = baseSphere.attributes.position;
    const bsIdx = baseSphere.index ? baseSphere.index.array : [];

    const addFoliageCluster = (
      cx: number,
      cy: number,
      cz: number,
      rx: number,
      ry: number,
      rz: number,
      baseColor: THREE.Color,
      topColor: THREE.Color,
      treeBaseY: number
    ) => {
      const localPos: number[] = [];
      for (let i = 0; i < bsPos.count; i++) {
        const vx = bsPos.getX(i);
        let vy = bsPos.getY(i);
        const vz = bsPos.getZ(i);

        if (vy < 0) vy *= 0.52;

        const n1 = fbm2((vx + cx) * 2.8, (vz + cz) * 2.8 + vy * 2.2, 3);
        const n2 = noise2D(vx * 6.2 + cz * 1.7, vz * 6.2 - cx * 1.7);
        const tuft = Math.sin(vx * 8.5 + cx * 3.0) * Math.cos(vz * 8.5 + cz * 3.0) * 0.11;
        const displace = 0.78 + 0.42 * n1 + 0.22 * n2 + tuft;

        const wx = cx + vx * rx * displace;
        const wy = cy + vy * ry * displace;
        const wz = cz + vz * rz * displace;
        localPos.push(wx, wy, wz);
      }

      const tmpG = new THREE.BufferGeometry();
      tmpG.setAttribute('position', new THREE.Float32BufferAttribute(localPos, 3));
      tmpG.setIndex(Array.from(bsIdx));
      tmpG.computeVertexNormals();
      const nAttr = tmpG.attributes.normal;

      for (let i = 0; i < bsPos.count; i++) {
        const wx = localPos[i * 3];
        const wy = localPos[i * 3 + 1];
        const wz = localPos[i * 3 + 2];
        let nx = nAttr.getX(i) + (noise2D(wx * 9.5, wz * 9.5) - 0.5) * 0.38;
        let ny = nAttr.getY(i) + (noise2D(wy * 9.5, wx * 9.5) - 0.5) * 0.25;
        let nz = nAttr.getZ(i) + (noise2D(wz * 9.5, wy * 9.5) - 0.5) * 0.38;
        const nLen = Math.hypot(nx, ny, nz) || 1;
        nx /= nLen;
        ny /= nLen;
        nz /= nLen;
        foliagePos.push(wx, wy, wz);
        foliageNorm.push(nx, ny, nz);

        const localTopT = Math.max(0, Math.min(1, (ny + 0.55) / 1.45));
        const canopyHeightT = Math.max(0, Math.min(1, (wy - treeBaseY) / 1.65));
        const ao = (0.56 + 0.44 * localTopT) * (0.76 + 0.24 * canopyHeightT);
        const microVar = 0.92 + 0.16 * noise2D(wx * 4.0, wz * 4.0);

        const c = baseColor.clone().lerp(topColor, localTopT * 0.82);
        foliageCol.push(
          Math.min(1, c.r * ao * microVar),
          Math.min(1, c.g * ao * microVar),
          Math.min(1, c.b * ao * microVar)
        );
      }

      for (let i = 0; i < bsIdx.length; i++) {
        foliageIdx.push(foliageVertOffset + bsIdx[i]);
      }
      foliageVertOffset += bsPos.count;
    };

    const addPineTree = (x: number, z: number, scale = 1.0, leanX = 0.0, leanZ = 0.0, paletteIdx = 2) => {
      const baseY = getTerrainHeight(x, z) - 0.05;
      const trunkH = (0.95 + 0.28 * Math.abs(noise2D(x * 1.3, z * 1.3))) * scale;
      const topX = x + leanX * scale;
      const topY = baseY + trunkH;
      const topZ = z + leanZ * scale;

      addBranchSegment(x, baseY, z, topX, topY, topZ, 0.075 * scale, 0.032 * scale, 6);

      const cDark = pinePalette[Math.max(0, paletteIdx - 1)];
      const cBright = pinePalette[Math.min(pinePalette.length - 1, paletteIdx + 2)];

      addFoliageCluster(
        topX,
        topY + 0.08 * scale,
        topZ,
        0.54 * scale,
        0.36 * scale,
        0.52 * scale,
        cDark,
        cBright,
        baseY
      );

      const branchCount = 5;
      for (let b = 0; b < branchCount; b++) {
        const t = 0.38 + (b / branchCount) * 0.54;
        const ang = b * 2.39996 + x * 1.7 + z * 2.3;
        const bLen = (0.44 + (1.0 - t) * 0.42) * scale;
        const bx1 = x + (topX - x) * t;
        const by1 = baseY + trunkH * t;
        const bz1 = z + (topZ - z) * t;
        const bx2 = bx1 + Math.cos(ang) * bLen;
        const by2 = by1 + 0.06 * scale;
        const bz2 = bz1 + Math.sin(ang) * bLen;

        addBranchSegment(bx1, by1, bz1, bx2, by2, bz2, 0.035 * scale, 0.016 * scale, 5);

        const padR = (0.44 + (1.0 - t) * 0.26) * scale;
        const padH = padR * 0.65;
        addFoliageCluster(bx2, by2 + 0.04 * scale, bz2, padR, padH, padR * 0.94, cDark, cBright, baseY);
      }
    };

    const isExcludedZone = (x: number, z: number) => {
      if (Math.hypot(x + 2.35, z + 2.55) < 0.98) return true;
      if (x > -1.75 && x < 1.15 && z > -1.95 && z < -0.65) return true;
      if (x > -3.25 && x < 2.15 && z >= -0.65 && z < 2.45) return true;
      return false;
    };

    addPineTree(-4.28, 0.42, 0.96, 0.35, 0.24, 3);
    addPineTree(-4.65, 0.85, 0.68, -0.22, 0.28, 2);
    addPineTree(2.82, 1.88, 1.02, -0.32, 0.25, 3);
    addPineTree(3.25, 2.20, 0.72, 0.22, 0.18, 4);

    for (let i = 0; i < 58; i++) {
      const ang = i * 2.3999632;
      const rNorm = Math.sqrt((i + 0.5) / 58);
      const sx = 0.85 + Math.cos(ang) * rNorm * 5.25;
      const sz = -2.85 + Math.sin(ang) * rNorm * 3.85;

      if (isExcludedZone(sx, sz)) continue;
      const sy = getTerrainHeight(sx, sz);
      if (sy < 0.35) continue;

      const scale = 0.82 + 0.42 * (1.0 - rNorm * 0.55) + 0.15 * Math.abs(noise2D(sx, sz));
      const pIdx = 1 + ((i * 3) % 5);
      const lx = (noise2D(sx * 2.1, sz * 2.1) - 0.5) * 0.22;
      const lz = (noise2D(sz * 2.1, sx * 2.1) - 0.5) * 0.22;
      addPineTree(sx, sz, scale, lx, lz, pIdx);
    }

    for (let i = 0; i < 270; i++) {
      const ang = i * 2.3999632 + 0.5;
      const rNorm = Math.pow((i + 0.5) / 270, 0.58);
      const sx = 0.75 + Math.cos(ang) * rNorm * 5.85;
      const sz = -2.65 + Math.sin(ang) * rNorm * 4.35;

      if (isExcludedZone(sx, sz)) continue;
      const sy = getTerrainHeight(sx, sz);
      if (sy < 0.25) continue;

      const pIdx = 1 + ((i * 5) % (pinePalette.length - 2));
      const cDark = pinePalette[Math.max(0, pIdx - 1)];
      const cBright = pinePalette[Math.min(pinePalette.length - 1, pIdx + 2)];

      const baseR = 0.34 + (i % 6) * 0.075 * (1.0 - rNorm * 0.28);
      const liftY = 0.18 + (i % 4) * 0.12;
      addFoliageCluster(
        sx,
        sy + liftY,
        sz,
        baseR * 1.24,
        baseR * 0.58,
        baseR * 1.20,
        cDark,
        cBright,
        sy - 0.15
      );
    }

    const framingClusters = [
      { x: -1.05, z: -2.25, r: 0.56, p: 3 },
      { x: -0.45, z: -2.35, r: 0.62, p: 4 },
      { x: 0.25, z: -2.30, r: 0.58, p: 3 },
      { x: 0.95, z: -2.15, r: 0.55, p: 4 },
      { x: -0.75, z: -2.75, r: 0.64, p: 2 },
      { x: 0.15, z: -2.85, r: 0.65, p: 3 },
      { x: 0.85, z: -2.65, r: 0.60, p: 4 },
      { x: -1.45, z: -2.25, r: 0.48, p: 4 },
      { x: -1.65, z: -1.75, r: 0.42, p: 5 },
      { x: -3.15, z: -2.15, r: 0.52, p: 3 },
      { x: -2.95, z: -1.55, r: 0.45, p: 4 },
      { x: -3.35, z: -0.95, r: 0.40, p: 3 },
      { x: 1.65, z: -1.55, r: 0.52, p: 4 },
      { x: 2.05, z: -1.15, r: 0.46, p: 5 },
      { x: 2.65, z: -0.45, r: 0.44, p: 3 },
      { x: 3.15, z: 0.35, r: 0.46, p: 4 },
      { x: 2.85, z: 0.85, r: 0.45, p: 3 },
      { x: 3.45, z: -0.15, r: 0.48, p: 4 },
      { x: 2.35, z: 1.05, r: 0.42, p: 5 },
      { x: -0.15, z: -1.95, r: 0.54, p: 3 },
      { x: -0.85, z: -1.95, r: 0.52, p: 4 },
      { x: 0.55, z: -1.95, r: 0.52, p: 3 },
      { x: -3.85, z: 0.25, r: 0.36, p: 4 },
      { x: 2.35, z: 1.65, r: 0.38, p: 5 }
    ];
    for (const fc of framingClusters) {
      const sy = getTerrainHeight(fc.x, fc.z);
      addFoliageCluster(
        fc.x,
        sy + fc.r * 0.45,
        fc.z,
        fc.r * 1.15,
        fc.r * 0.82,
        fc.r * 1.12,
        pinePalette[fc.p - 1],
        pinePalette[fc.p + 2],
        sy
      );
    }

    const tGeom = new THREE.BufferGeometry();
    tGeom.setAttribute('position', new THREE.Float32BufferAttribute(trunkPos, 3));
    tGeom.setAttribute('normal', new THREE.Float32BufferAttribute(trunkNorm, 3));
    tGeom.setAttribute('color', new THREE.Float32BufferAttribute(trunkCol, 3));
    tGeom.setIndex(trunkIdx);

    const fGeom = new THREE.BufferGeometry();
    fGeom.setAttribute('position', new THREE.Float32BufferAttribute(foliagePos, 3));
    fGeom.setAttribute('normal', new THREE.Float32BufferAttribute(foliageNorm, 3));
    fGeom.setAttribute('color', new THREE.Float32BufferAttribute(foliageCol, 3));
    fGeom.setIndex(foliageIdx);

    return { trunkGeom: tGeom, foliageGeom: fGeom };
  }, []);

  return (
    <group name="PineVegetationGroup">
      <mesh geometry={trunkGeom} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.85} metalness={0.02} />
      </mesh>
      <mesh geometry={foliageGeom} scale={[1, foliageScale, 1]} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.78} metalness={0.02} />
      </mesh>
    </group>
  );
};

import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  DIORAMA_HALF,
  DIORAMA_CORNER,
  BASE_BOTTOM_Y,
  fbm2,
  noise2D,
  smoothstep,
  mapGridToRoundedSquare,
  getTerrainHeight,
  getTerrainNormal,
  getPerimeterPoints
} from '../utils/noiseAndTerrain';

export const IslandTerrain: React.FC = () => {
  const { terrainGeom, skirtGeom, boulderGeom } = useMemo(() => {
    const gridN = 156;
    const gridN1 = gridN + 1;
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const cDeepSand = new THREE.Color('#8ca89f');
    const cShallowSand = new THREE.Color('#e2d4b7');
    const cWetSand = new THREE.Color('#c7b38f');
    const cDrySand = new THREE.Color('#efe2c8');
    const cCliffDark = new THREE.Color('#454843');
    const cCliffMid = new THREE.Color('#636760');
    const cCliffLight = new THREE.Color('#7c8077');
    const cMossDark = new THREE.Color('#233f1e');
    const cMossMid = new THREE.Color('#325428');
    const cMossLight = new THREE.Color('#466934');
    const tmpCol = new THREE.Color();

    for (let iz = 0; iz <= gridN; iz++) {
      const v = (iz / gridN) * 2 - 1;
      for (let ix = 0; ix <= gridN; ix++) {
        const u = (ix / gridN) * 2 - 1;
        const pt = mapGridToRoundedSquare(u, v, DIORAMA_HALF, DIORAMA_CORNER);
        let h = getTerrainHeight(pt.x, pt.z);
        const n = getTerrainNormal(pt.x, pt.z, 0.09);

        if (h > 0.25 && n.y < 0.78) {
          const strata = Math.sin(h * 7.5 + fbm2(pt.x * 0.9, pt.z * 0.9, 2) * 2.0) * 0.035 * (1.0 - n.y);
          h += strata;
        }

        positions.push(pt.x, h, pt.z);
        normals.push(n.x, n.y, n.z);
        uvs.push(ix / gridN, iz / gridN);

        const nVal = fbm2(pt.x * 0.65 + 7.1, pt.z * 0.65 - 3.4, 3);
        const detailVal = noise2D(pt.x * 2.4, pt.z * 2.4);

        if (h < -0.36) {
          const depthT = smoothstep(-0.36, -0.95, h);
          tmpCol.copy(cShallowSand).lerp(cDeepSand, depthT * 0.75);
          if (nVal + detailVal * 0.4 > 0.24) {
            tmpCol.lerp(cCliffDark, 0.28);
          }
        } else if (h < -0.04) {
          const t = smoothstep(-0.36, -0.04, h);
          tmpCol.copy(cShallowSand).lerp(cWetSand, t * 0.65);
        } else if (h < 0.35) {
          const t = smoothstep(-0.04, 0.35, h);
          tmpCol.copy(cWetSand).lerp(cDrySand, t);
          const isLeftStack = Math.hypot(pt.x + 4.25, pt.z - 0.55) < 1.65;
          const isRightStack = Math.hypot(pt.x - 2.75, pt.z - 1.95) < 1.75;
          if (n.y < 0.80 || isLeftStack || isRightStack) {
            const rockMix = (isLeftStack || isRightStack) ? 0.88 : smoothstep(0.80, 0.55, n.y);
            tmpCol.lerp(cCliffMid, rockMix);
          }
        } else {
          const slopeT = smoothstep(0.42, 0.72, n.y);
          const heightMossBoost = smoothstep(0.6, 2.2, h) * 0.45;
          const mossWeight = Math.min(1.0, slopeT + heightMossBoost);
          const strataBand = 0.5 + 0.5 * Math.sin(h * 6.2 + nVal * 4.0);
          const rockCol = cCliffDark.clone().lerp(cCliffMid, strataBand).lerp(cCliffLight, Math.max(0, detailVal));
          const mossCol = cMossDark.clone().lerp(cMossMid, smoothstep(0.4, 3.8, h)).lerp(cMossLight, Math.max(0, nVal + 0.15));
          tmpCol.copy(rockCol).lerp(mossCol, mossWeight);
        }

        const microShade = 0.94 + 0.12 * detailVal;
        colors.push(
          Math.min(1, tmpCol.r * microShade),
          Math.min(1, tmpCol.g * microShade),
          Math.min(1, tmpCol.b * microShade)
        );
      }
    }

    for (let iz = 0; iz < gridN; iz++) {
      for (let ix = 0; ix < gridN; ix++) {
        const a = iz * gridN1 + ix;
        const b = (iz + 1) * gridN1 + ix;
        const c = (iz + 1) * gridN1 + (ix + 1);
        const d = iz * gridN1 + (ix + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    const tGeom = new THREE.BufferGeometry();
    tGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    tGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    tGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    tGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    tGeom.setIndex(indices);

    // 2. Perimeter Warm Sandstone/Wood Diorama Plinth Base
    const perimPts = getPerimeterPoints(gridN);
    const skirtPos: number[] = [];
    const skirtNorm: number[] = [];
    const skirtCol: number[] = [];
    const skirtIdx: number[] = [];
    const cEarthTop = new THREE.Color('#c2a472');
    const cEarthBot = new THREE.Color('#96784a');
    const pCount = perimPts.length;

    for (let i = 0; i <= pCount; i++) {
      const pt = perimPts[i % pCount];
      const nextPt = perimPts[(i + 1) % pCount];
      const prevPt = perimPts[(i - 1 + pCount) % pCount];
      const tx = nextPt.x - prevPt.x;
      const tz = nextPt.z - prevPt.z;
      const tLen = Math.hypot(tx, tz) || 1;
      const nx = tz / tLen;
      const nz = -tx / tLen;

      const topY = getTerrainHeight(pt.x, pt.z);
      const botY = BASE_BOTTOM_Y;

      skirtPos.push(pt.x, topY, pt.z);
      skirtNorm.push(nx, 0.05, nz);
      skirtCol.push(cEarthTop.r, cEarthTop.g, cEarthTop.b);

      skirtPos.push(pt.x, botY, pt.z);
      skirtNorm.push(nx, -0.05, nz);
      skirtCol.push(cEarthBot.r, cEarthBot.g, cEarthBot.b);
    }

    for (let i = 0; i < pCount; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2 + 1;
      const d = (i + 1) * 2;
      skirtIdx.push(a, d, b, b, d, c);
    }

    const sGeom = new THREE.BufferGeometry();
    sGeom.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
    sGeom.setAttribute('normal', new THREE.Float32BufferAttribute(skirtNorm, 3));
    sGeom.setAttribute('color', new THREE.Float32BufferAttribute(skirtCol, 3));
    sGeom.setIndex(skirtIdx);

    // 3. Sculpted Coastal Boulders & Sea Stacks
    const rockSpecs = [
      { x: -4.25, z: 0.55, r: 0.88, sy: 1.15, moss: 0.75 },
      { x: -4.75, z: 0.95, r: 0.58, sy: 0.85, moss: 0.45 },
      { x: -3.65, z: 0.85, r: 0.50, sy: 0.75, moss: 0.50 },
      { x: -4.55, z: -0.15, r: 0.62, sy: 0.95, moss: 0.65 },
      { x: 2.75, z: 1.95, r: 0.96, sy: 1.22, moss: 0.80 },
      { x: 3.45, z: 2.25, r: 0.58, sy: 0.82, moss: 0.45 },
      { x: 2.15, z: 2.35, r: 0.48, sy: 0.72, moss: 0.35 },
      { x: 3.15, z: 1.35, r: 0.65, sy: 0.98, moss: 0.65 },
      { x: 5.85, z: 2.15, r: 0.32, sy: 0.45, moss: 0.1 },
      { x: 6.45, z: 2.65, r: 0.24, sy: 0.40, moss: 0.0 },
      { x: 4.55, z: 3.95, r: 0.28, sy: 0.42, moss: 0.0 },
      { x: -5.85, z: 2.85, r: 0.35, sy: 0.48, moss: 0.1 },
      { x: -6.35, z: 3.45, r: 0.24, sy: 0.38, moss: 0.0 },
      { x: -3.25, z: 5.85, r: 0.38, sy: 0.42, moss: 0.0 },
      { x: -2.65, z: 6.35, r: 0.22, sy: 0.36, moss: 0.0 },
      { x: -4.45, z: 7.45, r: 0.36, sy: 0.40, moss: 0.0 },
      { x: 1.65, z: 5.65, r: 0.32, sy: 0.40, moss: 0.0 },
      { x: 0.85, z: 6.85, r: 0.25, sy: 0.36, moss: 0.0 },
      { x: -7.25, z: -1.45, r: 0.42, sy: 0.52, moss: 0.2 },
      { x: 6.75, z: -0.85, r: 0.38, sy: 0.50, moss: 0.2 },
      { x: -1.25, z: -2.15, r: 0.78, sy: 1.15, moss: 0.75 },
      { x: -0.35, z: -2.45, r: 0.85, sy: 1.20, moss: 0.80 },
      { x: 0.65, z: -2.25, r: 0.82, sy: 1.18, moss: 0.75 },
      { x: 1.45, z: -1.95, r: 0.72, sy: 1.05, moss: 0.70 },
      { x: -2.05, z: -1.65, r: 0.68, sy: 0.95, moss: 0.65 }
    ];

    const boulderPos: number[] = [];
    const boulderNorm: number[] = [];
    const boulderCol: number[] = [];
    const boulderIdx: number[] = [];
    let bVertOffset = 0;

    for (const spec of rockSpecs) {
      const baseH = getTerrainHeight(spec.x, spec.z);
      const sph = new THREE.IcosahedronGeometry(spec.r, 2);
      const pAttr = sph.attributes.position;
      const localPos: number[] = [];

      for (let i = 0; i < pAttr.count; i++) {
        let vx = pAttr.getX(i);
        let vy = pAttr.getY(i);
        let vz = pAttr.getZ(i);
        const n1 = fbm2((vx + spec.x) * 1.9, (vz + spec.z) * 1.9 + vy * 1.5, 3);
        const disp = 0.82 + 0.42 * n1;
        vx *= disp;
        vy *= disp * spec.sy;
        vz *= disp;
        if (vy < -spec.r * 0.45) vy = -spec.r * 0.45 + (vy + spec.r * 0.45) * 0.3;
        localPos.push(vx + spec.x, vy + baseH + spec.r * spec.sy * 0.22, vz + spec.z);
      }

      const tmpG = new THREE.BufferGeometry();
      tmpG.setAttribute('position', new THREE.Float32BufferAttribute(localPos, 3));
      if (sph.index) tmpG.setIndex(Array.from(sph.index.array));
      tmpG.computeVertexNormals();
      const nAttr = tmpG.attributes.normal;

      for (let i = 0; i < pAttr.count; i++) {
        const wx = localPos[i * 3];
        const wy = localPos[i * 3 + 1];
        const wz = localPos[i * 3 + 2];
        const nx = nAttr.getX(i);
        const ny = nAttr.getY(i);
        const nz = nAttr.getZ(i);
        boulderPos.push(wx, wy, wz);
        boulderNorm.push(nx, ny, nz);

        const isMossy = spec.moss > 0.2 && ny > 0.52 && wy > 0.08;
        const shade = 0.85 + 0.25 * noise2D(wx * 3.5, wz * 3.5);
        const col = isMossy
          ? cCliffMid.clone().lerp(cMossMid, smoothstep(0.52, 0.82, ny) * spec.moss)
          : cCliffDark.clone().lerp(cCliffMid, 0.55);
        boulderCol.push(col.r * shade, col.g * shade, col.b * shade);
      }

      if (sph.index) {
        const idxArr = sph.index.array;
        for (let i = 0; i < idxArr.length; i++) {
          boulderIdx.push(bVertOffset + idxArr[i]);
        }
      }
      bVertOffset += pAttr.count;
    }

    const bGeom = new THREE.BufferGeometry();
    bGeom.setAttribute('position', new THREE.Float32BufferAttribute(boulderPos, 3));
    bGeom.setAttribute('normal', new THREE.Float32BufferAttribute(boulderNorm, 3));
    bGeom.setAttribute('color', new THREE.Float32BufferAttribute(boulderCol, 3));
    bGeom.setIndex(boulderIdx);

    return {
      terrainGeom: tGeom,
      skirtGeom: sGeom,
      boulderGeom: bGeom
    };
  }, []);

  return (
    <group name="IslandTerrainGroup">
      <mesh geometry={terrainGeom} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.86} metalness={0.04} />
      </mesh>
      <mesh geometry={skirtGeom} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh geometry={boulderGeom} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.05} />
      </mesh>
    </group>
  );
};

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/noiseAndTerrain';

interface ShrineArchitectureProps {
  lanternIntensity: number;
}

export const ShrineArchitecture: React.FC<ShrineArchitectureProps> = ({ lanternIntensity }) => {
  const { archGroup, lanternLights } = useMemo(() => {
    const mats = {
      vermilion: new THREE.MeshStandardMaterial({ color: '#c8281c', roughness: 0.36, metalness: 0.08 }),
      vermilionDark: new THREE.MeshStandardMaterial({ color: '#9a1c13', roughness: 0.44, metalness: 0.08 }),
      roofSlate: new THREE.MeshStandardMaterial({ color: '#272529', roughness: 0.62, metalness: 0.14 }),
      roofBark: new THREE.MeshStandardMaterial({ color: '#332926', roughness: 0.72, metalness: 0.06 }),
      woodCypress: new THREE.MeshStandardMaterial({ color: '#b58858', roughness: 0.68, metalness: 0.04 }),
      woodAged: new THREE.MeshStandardMaterial({ color: '#705338', roughness: 0.78, metalness: 0.04 }),
      woodDark: new THREE.MeshStandardMaterial({ color: '#2b221c', roughness: 0.80, metalness: 0.05 }),
      plasterWhite: new THREE.MeshStandardMaterial({ color: '#f3eee4', roughness: 0.74, metalness: 0.02 }),
      goldTrim: new THREE.MeshStandardMaterial({ color: '#dfb14b', roughness: 0.26, metalness: 0.75 }),
      plaqueNavy: new THREE.MeshStandardMaterial({ color: '#182438', roughness: 0.40, metalness: 0.20 }),
      stoneGranite: new THREE.MeshStandardMaterial({ color: '#8b8d86', roughness: 0.85, metalness: 0.04 }),
      stoneDark: new THREE.MeshStandardMaterial({ color: '#5c5f58', roughness: 0.88, metalness: 0.04 }),
      lanternGlow: new THREE.MeshStandardMaterial({
        color: '#ffdf9e',
        emissive: '#ffaa3b',
        emissiveIntensity: 1.35,
        roughness: 0.25
      })
    };

    const addBox = (
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      rx = 0,
      ry = 0,
      rz = 0,
      cast = true
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx, ry, rz);
      m.castShadow = cast;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    const addCyl = (
      parent: THREE.Object3D,
      rt: number,
      rb: number,
      h: number,
      segs: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      rx = 0,
      ry = 0,
      rz = 0,
      cast = true
    ) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx, ry, rz);
      m.castShadow = cast;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    const buildCurvedRoof = (
      w: number,
      h: number,
      d: number,
      opts: { irimoya?: boolean; useSlate?: boolean; thickness?: number; curveLift?: number; sacredFinials?: boolean } = {}
    ) => {
      const group = new THREE.Group();
      const segX = 16;
      const segZ = 12;
      const geom = new THREE.BoxGeometry(w, opts.thickness || 0.12, d, segX, 1, segZ);
      const pos = geom.attributes.position;
      const isGabled = opts.irimoya !== false;
      const curveLift = opts.curveLift ?? 0.24;

      for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i);
        const vy = pos.getY(i);
        let vz = pos.getZ(i);
        const nx = vx / (w * 0.5);
        const nz = vz / (d * 0.5);
        const ax = Math.abs(nx);
        const az = Math.abs(nz);

        let pitch: number;
        if (isGabled) {
          const hipZ = Math.max(0, 1.0 - az);
          const hipX = Math.max(0, 1.0 - Math.max(0, ax - 0.38) / 0.62);
          pitch = Math.pow(hipZ, 0.78) * Math.pow(hipX, 0.65) * h;
        } else {
          const edgeDist = Math.max(ax, az);
          pitch = Math.pow(Math.max(0, 1.0 - edgeDist), 0.72) * h;
        }

        const rCorner = Math.hypot(nx, nz);
        const cornerFlare = Math.pow(Math.max(0, rCorner - 0.65) / 0.76, 2.0) * curveLift;
        if (vy < 0) {
          vx *= 1.025;
          vz *= 1.025;
        }
        pos.setXYZ(i, vx, vy + pitch + cornerFlare, vz);
      }
      geom.computeVertexNormals();

      const roofMesh = new THREE.Mesh(geom, opts.useSlate ? mats.roofSlate : mats.roofBark);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      group.add(roofMesh);

      if (isGabled) {
        const ridgeW = w * 0.52;
        addBox(group, ridgeW, 0.16, 0.18, mats.roofSlate, 0, h + 0.06, 0);
        addBox(group, ridgeW + 0.08, 0.05, 0.21, mats.goldTrim, 0, h + 0.15, 0);
        addBox(group, 0.10, 0.22, 0.22, mats.goldTrim, -ridgeW * 0.5, h + 0.10, 0);
        addBox(group, 0.10, 0.22, 0.22, mats.goldTrim, ridgeW * 0.5, h + 0.10, 0);
        addBox(group, 0.08, h * 0.42, d * 0.34, mats.plasterWhite, -w * 0.22, h * 0.52, 0);
        addBox(group, 0.08, h * 0.42, d * 0.34, mats.plasterWhite, w * 0.22, h * 0.52, 0);

        if (opts.sacredFinials) {
          for (const side of [-1, 1]) {
            const cx = side * (ridgeW * 0.42);
            addBox(group, 0.05, 0.55, 0.05, mats.goldTrim, cx, h + 0.28, 0.08, 0.42, 0, side * -0.15);
            addBox(group, 0.05, 0.55, 0.05, mats.goldTrim, cx, h + 0.28, -0.08, -0.42, 0, side * -0.15);
          }
          for (let k = -2; k <= 2; k++) {
            addCyl(group, 0.045, 0.045, 0.32, 8, mats.goldTrim, k * (ridgeW * 0.16), h + 0.19, 0, Math.PI / 2, 0, 0);
          }
        }
      }
      return group;
    };

    const buildRyobuTorii = () => {
      const torii = new THREE.Group();
      const span = 2.12;
      const halfSpan = span * 0.5;
      const pillarH = 2.68;

      for (const side of [-1, 1]) {
        const px = side * halfSpan;
        const tilt = side * 0.025;
        addCyl(torii, 0.125, 0.148, pillarH, 16, mats.vermilion, px, pillarH * 0.5, 0, 0, 0, tilt);
        addCyl(torii, 0.156, 0.168, 0.62, 16, mats.roofSlate, px, 0.31, 0, 0, 0, tilt);

        const outZ = 0.64;
        const outH = 1.72;
        for (const zDir of [-1, 1]) {
          const oz = zDir * outZ;
          const ox = px + side * 0.04;
          addCyl(torii, 0.078, 0.092, outH, 12, mats.vermilion, ox, outH * 0.5, oz);
          addCyl(torii, 0.098, 0.106, 0.48, 12, mats.roofSlate, ox, 0.24, oz);
          addBox(torii, 0.22, 0.07, 0.22, mats.roofSlate, ox, outH + 0.03, oz);
        }

        addBox(torii, 0.10, 0.11, outZ * 2.35, mats.vermilion, px, 1.24, 0);
        addBox(torii, 0.09, 0.09, outZ * 2.25, mats.vermilion, px, 0.72, 0);
        addBox(torii, 0.24, 0.05, outZ * 2.45, mats.roofSlate, px, 1.32, 0);
      }

      const nukiW = span + 1.18;
      addBox(torii, nukiW, 0.16, 0.13, mats.vermilion, 0, 2.08, 0);
      for (const side of [-1, 1]) {
        addBox(torii, 0.32, 0.22, 0.16, mats.vermilionDark, side * halfSpan, 2.08, 0);
      }

      const kasagiW = span + 1.68;
      const segs = 20;
      const shimakiGeom = new THREE.BoxGeometry(kasagiW, 0.15, 0.22, segs, 1, 1);
      const kasagiGeom = new THREE.BoxGeometry(kasagiW + 0.18, 0.14, 0.30, segs, 1, 2);

      const bendBeam = (geom: THREE.BufferGeometry, lift: number) => {
        const p = geom.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const vx = p.getX(i);
          const vy = p.getY(i);
          const vz = p.getZ(i);
          const u = Math.abs(vx) / (kasagiW * 0.5);
          const curve = Math.pow(u, 2.35) * lift;
          const tipScale = 1.0 + Math.pow(u, 3.0) * 0.18;
          p.setXYZ(i, vx, vy + curve, vz * tipScale);
        }
        geom.computeVertexNormals();
      };
      bendBeam(shimakiGeom, 0.24);
      bendBeam(kasagiGeom, 0.27);

      const shimakiMesh = new THREE.Mesh(shimakiGeom, mats.vermilion);
      shimakiMesh.position.set(0, 2.58, 0);
      shimakiMesh.castShadow = true;
      torii.add(shimakiMesh);

      const kasagiMesh = new THREE.Mesh(kasagiGeom, mats.roofSlate);
      kasagiMesh.position.set(0, 2.72, 0);
      kasagiMesh.castShadow = true;
      torii.add(kasagiMesh);

      for (const side of [-1, 1]) {
        addBox(torii, 0.08, 0.16, 0.24, mats.goldTrim, side * (kasagiW * 0.5 + 0.02), 2.83, 0, 0, 0, side * 0.24);
      }

      addBox(torii, 0.14, 0.50, 0.12, mats.vermilion, 0, 2.33, 0);
      addBox(torii, 0.34, 0.44, 0.06, mats.goldTrim, 0, 2.34, 0.06);
      addBox(torii, 0.28, 0.38, 0.07, mats.plaqueNavy, 0, 2.34, 0.062);
      addBox(torii, 0.04, 0.26, 0.075, mats.goldTrim, 0, 2.34, 0.065);

      return torii;
    };

    const buildSmallTorii = (scale = 1.0) => {
      const g = new THREE.Group();
      const span = 1.15 * scale;
      const h = 1.48 * scale;
      for (const s of [-1, 1]) {
        addCyl(g, 0.055 * scale, 0.068 * scale, h, 10, mats.vermilion, s * span * 0.5, h * 0.5, 0);
        addCyl(g, 0.072 * scale, 0.078 * scale, 0.25 * scale, 10, mats.roofSlate, s * span * 0.5, 0.125 * scale, 0);
      }
      addBox(g, span + 0.45 * scale, 0.08 * scale, 0.07 * scale, mats.vermilion, 0, h * 0.78, 0);
      addBox(g, span + 0.62 * scale, 0.08 * scale, 0.12 * scale, mats.vermilion, 0, h * 0.96, 0);
      addBox(g, span + 0.72 * scale, 0.07 * scale, 0.16 * scale, mats.roofSlate, 0, h * 1.02, 0);
      addBox(g, 0.07 * scale, 0.18 * scale, 0.06 * scale, mats.vermilion, 0, h * 0.87, 0);
      return g;
    };

    const buildStoneLantern = (scale = 1.0) => {
      const g = new THREE.Group();
      addBox(g, 0.34 * scale, 0.10 * scale, 0.34 * scale, mats.stoneDark, 0, 0.05 * scale, 0);
      addCyl(g, 0.075 * scale, 0.095 * scale, 0.36 * scale, 8, mats.stoneGranite, 0, 0.28 * scale, 0);
      addBox(g, 0.28 * scale, 0.07 * scale, 0.28 * scale, mats.stoneGranite, 0, 0.48 * scale, 0);
      addBox(g, 0.18 * scale, 0.18 * scale, 0.18 * scale, mats.lanternGlow, 0, 0.60 * scale, 0, 0, 0, 0, false);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          addBox(g, 0.03 * scale, 0.19 * scale, 0.03 * scale, mats.stoneDark, sx * 0.085 * scale, 0.60 * scale, sz * 0.085 * scale);
        }
      }
      const roof = buildCurvedRoof(0.46 * scale, 0.15 * scale, 0.46 * scale, {
        irimoya: false,
        useSlate: true,
        thickness: 0.05 * scale,
        curveLift: 0.06 * scale
      });
      roof.position.set(0, 0.70 * scale, 0);
      g.add(roof);
      addCyl(g, 0.01 * scale, 0.05 * scale, 0.12 * scale, 8, mats.stoneGranite, 0, 0.89 * scale, 0);
      return g;
    };

    const buildFiveStoryPagoda = () => {
      const pagoda = new THREE.Group();
      addBox(pagoda, 1.95, 0.45, 1.95, mats.stoneGranite, 0, 0.12, 0);
      addBox(pagoda, 1.78, 0.16, 1.78, mats.stoneDark, 0, 0.40, 0);
      for (let s = 0; s < 3; s++) {
        addBox(pagoda, 0.52, 0.12, 0.22, mats.stoneGranite, 0, 0.08 + s * 0.12, 0.98 - s * 0.08);
      }

      let curY = 0.48;
      for (let tier = 0; tier < 5; tier++) {
        const taper = 1.0 - tier * 0.115;
        const coreW = 1.18 * taper;
        const storyH = (tier === 0 ? 0.62 : 0.48) * (1.0 - tier * 0.04);
        const roofW = 1.92 * taper;
        const roofH = 0.34 * taper;

        addBox(pagoda, coreW, storyH, coreW, mats.plasterWhite, 0, curY + storyH * 0.5, 0);

        const halfC = coreW * 0.5 + 0.015;
        for (const sx of [-1, 0, 1]) {
          for (const sz of [-1, 0, 1]) {
            if (sx === 0 && sz === 0) continue;
            addBox(pagoda, 0.055, storyH, 0.055, mats.vermilion, sx * halfC, curY + storyH * 0.5, sz * halfC);
          }
        }

        const balW = coreW + 0.28 * taper;
        addBox(pagoda, balW, 0.05, balW, mats.woodCypress, 0, curY + 0.03, 0);
        addBox(pagoda, balW + 0.04, 0.11, balW + 0.04, mats.vermilionDark, 0, curY + 0.09, 0);
        addBox(pagoda, coreW + 0.22 * taper, 0.09, coreW + 0.22 * taper, mats.vermilion, 0, curY + storyH - 0.03, 0);

        const roof = buildCurvedRoof(roofW, roofH, roofW, {
          irimoya: false,
          useSlate: true,
          thickness: 0.08,
          curveLift: 0.16 * taper
        });
        roof.position.set(0, curY + storyH + 0.02, 0);
        pagoda.add(roof);

        curY += storyH + roofH * 0.76;
      }

      addBox(pagoda, 0.26, 0.12, 0.26, mats.roofSlate, 0, curY + 0.04, 0);
      addCyl(pagoda, 0.022, 0.052, 1.15, 10, mats.goldTrim, 0, curY + 0.62, 0);
      for (let r = 0; r < 7; r++) {
        const ry = curY + 0.22 + r * 0.095;
        const rad = 0.095 * (1.0 - r * 0.07);
        addCyl(pagoda, rad, rad, 0.025, 10, mats.goldTrim, 0, ry, 0);
      }
      addCyl(pagoda, 0.005, 0.055, 0.18, 8, mats.goldTrim, 0, curY + 1.18, 0);
      return pagoda;
    };

    const buildStiltedDeck = (
      parent: THREE.Object3D,
      cx: number,
      cy: number,
      cz: number,
      w: number,
      d: number,
      opts: { ry?: number; railingSides?: string[] } = {}
    ) => {
      const g = new THREE.Group();
      g.position.set(cx, cy, cz);
      if (opts.ry) g.rotation.y = opts.ry;

      addBox(g, w, 0.09, d, mats.woodCypress, 0, 0, 0);
      addBox(g, w + 0.06, 0.06, d + 0.06, mats.woodAged, 0, -0.06, 0);

      const nx = Math.max(2, Math.round(w / 0.85) + 1);
      const nz = Math.max(2, Math.round(d / 0.85) + 1);
      const stiltH = 1.25;
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          if (ix > 0 && ix < nx - 1 && iz > 0 && iz < nz - 1) continue;
          const sx = -w * 0.46 + (ix / (nx - 1)) * (w * 0.92);
          const sz = -d * 0.46 + (iz / (nz - 1)) * (d * 0.92);
          addCyl(g, 0.048, 0.055, stiltH, 8, mats.woodAged, sx, -stiltH * 0.5, sz);
          addCyl(g, 0.058, 0.064, 0.45, 8, mats.woodDark, sx, -stiltH + 0.22, sz);
        }
      }

      const rH = 0.24;
      const sides = opts.railingSides || ['front', 'left', 'right'];
      const addRailEdge = (x1: number, z1: number, x2: number, z2: number) => {
        const len = Math.hypot(x2 - x1, z2 - z1);
        const mx = (x1 + x2) * 0.5;
        const mz = (z1 + z2) * 0.5;
        const ang = Math.atan2(x2 - x1, z2 - z1);
        addBox(g, 0.045, 0.045, len + 0.04, mats.vermilion, mx, rH, mz, 0, ang, 0);
        addBox(g, 0.035, 0.035, len, mats.vermilionDark, mx, rH * 0.52, mz, 0, ang, 0);
        const postCount = Math.max(2, Math.round(len / 0.65) + 1);
        for (let p = 0; p < postCount; p++) {
          const t = p / (postCount - 1);
          const px = x1 + (x2 - x1) * t;
          const pz = z1 + (z2 - z1) * t;
          addBox(g, 0.055, rH + 0.05, 0.055, mats.vermilion, px, rH * 0.5, pz);
          addBox(g, 0.065, 0.05, 0.065, mats.goldTrim, px, rH + 0.05, pz);
        }
      };

      const hw = w * 0.48;
      const hd = d * 0.48;
      if (sides.includes('front')) addRailEdge(-hw, hd, hw, hd);
      if (sides.includes('back')) addRailEdge(-hw, -hd, hw, -hd);
      if (sides.includes('left')) addRailEdge(-hw, -hd, -hw, hd);
      if (sides.includes('right')) addRailEdge(hw, -hd, hw, hd);

      parent.add(g);
      return g;
    };

    const root = new THREE.Group();

    // 1. Grand Ryobu O-Torii
    const toriiBedY = getTerrainHeight(-1.65, 3.35);
    const grandTorii = buildRyobuTorii();
    grandTorii.position.set(-1.65, toriiBedY - 0.05, 3.35);
    grandTorii.rotation.y = -0.32;
    root.add(grandTorii);

    // 2. Floating Shrine Complex
    const shrineRoot = new THREE.Group();
    shrineRoot.position.set(-0.35, 0.0, -0.15);
    shrineRoot.rotation.y = -0.32;
    root.add(shrineRoot);

    const deckY = 0.42;
    buildStiltedDeck(shrineRoot, 0, deckY, 1.55, 3.45, 2.15, { railingSides: ['front', 'left', 'right'] });
    addBox(shrineRoot, 1.38, 0.14, 1.28, mats.woodDark, 0, deckY + 0.08, 1.52);
    addBox(shrineRoot, 1.28, 0.04, 1.18, mats.vermilion, 0, deckY + 0.16, 1.52);
    addBox(shrineRoot, 1.34, 0.10, 1.24, mats.vermilionDark, 0, deckY + 0.19, 1.52);
    addBox(shrineRoot, 1.20, 0.12, 1.10, mats.woodCypress, 0, deckY + 0.20, 1.52);

    buildStiltedDeck(shrineRoot, 0, deckY - 0.04, 2.95, 1.15, 0.95, { railingSides: ['front', 'left', 'right'] });

    buildStiltedDeck(shrineRoot, 0, deckY + 0.12, -0.05, 4.15, 2.10, { railingSides: ['left', 'right'] });
    const haidenH = 1.22;
    const haidenBaseY = deckY + 0.16;
    addBox(shrineRoot, 3.45, haidenH, 1.48, mats.plasterWhite, 0, haidenBaseY + haidenH * 0.5, -0.05);
    addBox(shrineRoot, 2.25, haidenH * 0.82, 1.52, mats.woodDark, 0, haidenBaseY + haidenH * 0.45, -0.05);
    addBox(shrineRoot, 0.95, haidenH * 0.72, 1.54, mats.lanternGlow, 0, haidenBaseY + haidenH * 0.42, -0.05, 0, 0, 0, false);

    for (let ix = -3; ix <= 3; ix++) {
      for (const iz of [-1, 1]) {
        addCyl(shrineRoot, 0.055, 0.062, haidenH + 0.05, 10, mats.vermilion, ix * 0.55, haidenBaseY + haidenH * 0.5, -0.05 + iz * 0.78);
      }
    }
    addBox(shrineRoot, 3.68, 0.09, 1.64, mats.vermilion, 0, haidenBaseY + haidenH - 0.06, -0.05);
    addBox(shrineRoot, 3.64, 0.07, 1.62, mats.vermilionDark, 0, haidenBaseY + haidenH * 0.65, -0.05);

    addCyl(shrineRoot, 0.035, 0.045, 1.45, 8, mats.woodCypress, 0, haidenBaseY + haidenH * 0.78, 0.82, 0, 0, Math.PI / 2);
    for (let s = -2; s <= 2; s++) {
      addBox(shrineRoot, 0.05, 0.16, 0.02, mats.plasterWhite, s * 0.26, haidenBaseY + haidenH * 0.68, 0.84, 0, 0, 0.12);
    }
    addBox(shrineRoot, 0.52, 0.22, 0.32, mats.woodAged, 0, haidenBaseY + 0.11, 0.85);
    addBox(shrineRoot, 1.25, 0.14, 0.35, mats.woodAged, 0, deckY + 0.06, 0.92);

    const haidenRoof = buildCurvedRoof(4.65, 1.08, 2.75, { irimoya: true, useSlate: false, thickness: 0.13, curveLift: 0.26 });
    haidenRoof.position.set(0, haidenBaseY + haidenH, -0.05);
    shrineRoot.add(haidenRoof);

    const porticoRoof = buildCurvedRoof(1.75, 0.44, 1.15, { irimoya: true, useSlate: false, thickness: 0.09, curveLift: 0.14 });
    porticoRoof.position.set(0, haidenBaseY + haidenH - 0.12, 0.85);
    shrineRoot.add(porticoRoof);

    const hondenY = deckY + 0.34;
    addBox(shrineRoot, 3.35, 0.75, 1.95, mats.stoneGranite, 0, hondenY - 0.38, -1.78);
    buildStiltedDeck(shrineRoot, 0, hondenY, -1.78, 3.25, 1.85, { railingSides: ['left', 'right', 'back'] });
    const hondenH = 1.32;
    addBox(shrineRoot, 2.65, hondenH, 1.32, mats.plasterWhite, 0, hondenY + hondenH * 0.5, -1.78);
    for (let ix = -2; ix <= 2; ix++) {
      for (const iz of [-1, 1]) {
        addCyl(shrineRoot, 0.058, 0.065, hondenH, 10, mats.vermilion, ix * 0.58, hondenY + hondenH * 0.5, -1.78 + iz * 0.68);
      }
    }
    addBox(shrineRoot, 2.78, 0.09, 1.44, mats.vermilion, 0, hondenY + hondenH - 0.05, -1.78);
    addBox(shrineRoot, 0.78, hondenH * 0.75, 1.36, mats.goldTrim, 0, hondenY + hondenH * 0.42, -1.78);

    const hondenRoof = buildCurvedRoof(3.85, 1.18, 2.45, {
      irimoya: true,
      useSlate: false,
      thickness: 0.14,
      curveLift: 0.28,
      sacredFinials: true
    });
    hondenRoof.position.set(0, hondenY + hondenH, -1.78);
    shrineRoot.add(hondenRoof);

    addBox(shrineRoot, 1.45, 0.95, 0.85, mats.vermilionDark, 0, deckY + 0.62, -0.95);
    const heidenRoof = buildCurvedRoof(1.95, 0.48, 1.25, { irimoya: false, useSlate: false, curveLift: 0.12 });
    heidenRoof.position.set(0, deckY + 1.12, -0.95);
    shrineRoot.add(heidenRoof);

    for (const side of [-1, 1]) {
      const corrX = side * 2.55;
      const corrZ = 0.25;
      buildStiltedDeck(shrineRoot, corrX, deckY, corrZ, 1.55, 0.95, { railingSides: ['front', 'back'] });
      for (let ix = -1; ix <= 1; ix++) {
        for (const iz of [-1, 1]) {
          addCyl(shrineRoot, 0.042, 0.048, 0.88, 8, mats.vermilion, corrX + ix * 0.55, deckY + 0.44, corrZ + iz * 0.36);
        }
      }
      const corrRoof = buildCurvedRoof(1.85, 0.38, 1.28, { irimoya: true, useSlate: false, thickness: 0.08, curveLift: 0.12 });
      corrRoof.position.set(corrX, deckY + 0.88, corrZ);
      shrineRoot.add(corrRoof);

      const wingX = side * 3.15;
      const wingZ = 1.25;
      buildStiltedDeck(shrineRoot, wingX, deckY, wingZ, 1.15, 1.65, { railingSides: ['front', 'left', 'right'] });
      addBox(shrineRoot, 0.78, 0.82, 1.05, mats.plasterWhite, wingX, deckY + 0.42, wingZ - 0.12);
      for (const ix of [-1, 1]) {
        for (const iz of [-1, 0, 1]) {
          addCyl(shrineRoot, 0.044, 0.05, 0.88, 8, mats.vermilion, wingX + ix * 0.42, deckY + 0.44, wingZ + iz * 0.52);
        }
      }
      const wingRoof = buildCurvedRoof(1.55, 0.52, 2.05, { irimoya: true, useSlate: false, thickness: 0.09, curveLift: 0.15 });
      wingRoof.position.set(wingX, deckY + 0.88, wingZ);
      shrineRoot.add(wingRoof);
    }

    // Arched Wooden Bridge (Soribashi)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-3.35, 0.18, 1.75);
    bridgeGroup.rotation.y = 0.55;
    const bridgeSegs = 12;
    const bLen = 1.85;
    const bW = 0.72;
    for (let i = 0; i < bridgeSegs; i++) {
      const t = (i + 0.5) / bridgeSegs;
      const u = t * 2 - 1;
      const bz = u * (bLen * 0.5);
      const by = (1.0 - u * u) * 0.44;
      const slope = Math.atan((-2 * u * 0.44) / (bLen * 0.5));
      addBox(bridgeGroup, bW, 0.06, (bLen / bridgeSegs) * 1.12, mats.woodCypress, 0, by, bz, slope, 0, 0);
      for (const sx of [-1, 1]) {
        addBox(bridgeGroup, 0.05, 0.22, (bLen / bridgeSegs) * 1.12, mats.vermilion, sx * (bW * 0.46), by + 0.12, bz, slope, 0, 0);
        if (i % 3 === 0) {
          addBox(bridgeGroup, 0.06, 0.28, 0.06, mats.vermilionDark, sx * (bW * 0.46), by + 0.14, bz);
          addBox(bridgeGroup, 0.07, 0.04, 0.07, mats.goldTrim, sx * (bW * 0.46), by + 0.29, bz);
        }
      }
    }
    for (const sz of [-0.55, 0, 0.55]) {
      for (const sx of [-0.28, 0.28]) {
        addCyl(bridgeGroup, 0.04, 0.045, 0.95, 8, mats.woodAged, sx, -0.15, sz);
      }
    }
    root.add(bridgeGroup);

    // Mountain Stone Stairway & Secondary Vermilion Torii Gates
    const stairPoints = [
      { x: 1.85, z: 0.55, ry: -0.25 },
      { x: 2.02, z: 0.18, ry: -0.20 },
      { x: 2.15, z: -0.18, ry: -0.15 },
      { x: 2.25, z: -0.55, ry: -0.10 },
      { x: 2.32, z: -0.92, ry: -0.05 },
      { x: 2.35, z: -1.28, ry: 0.05 },
      { x: 2.30, z: -1.65, ry: 0.15 },
      { x: 2.18, z: -2.02, ry: 0.25 },
      { x: -1.85, z: -1.25, ry: 0.35 },
      { x: -2.02, z: -1.55, ry: 0.30 },
      { x: -2.18, z: -1.85, ry: 0.25 }
    ];
    for (const sp of stairPoints) {
      const sy = getTerrainHeight(sp.x, sp.z);
      addBox(root, 0.68, 0.16, 0.34, mats.stoneGranite, sp.x, sy + 0.04, sp.z, 0, sp.ry, 0);
    }

    const smallToriiCoords = [
      { x: 1.98, z: 0.28, ry: -0.22, scale: 0.72 },
      { x: 2.28, z: -0.68, ry: -0.08, scale: 0.68 },
      { x: 2.26, z: -1.52, ry: 0.12, scale: 0.65 }
    ];
    for (const stc of smallToriiCoords) {
      const ty = getTerrainHeight(stc.x, stc.z);
      const st = buildSmallTorii(stc.scale);
      st.position.set(stc.x, ty - 0.04, stc.z);
      st.rotation.y = stc.ry;
      root.add(st);
    }

    // 3. Five-Story Pagoda (Goju-no-To)
    const pagoda = buildFiveStoryPagoda();
    const pagY = getTerrainHeight(-2.35, -2.55);
    pagoda.position.set(-2.35, pagY - 0.06, -2.55);
    pagoda.rotation.y = 0.22;
    root.add(pagoda);

    // 4. Stone Lanterns (Toro) + Point Lights
    const lanternSpecs = [
      { x: -2.85, z: 1.85, scale: 1.15, light: true },
      { x: 1.15, z: 2.55, scale: 1.15, light: true },
      { x: -3.95, z: 0.65, scale: 0.85, light: true },
      { x: 2.55, z: 1.85, scale: 0.85, light: true },
      { x: -1.25, z: 1.35, yOverride: 0.45, scale: 0.78, light: true },
      { x: 0.15, z: 1.82, yOverride: 0.45, scale: 0.78, light: true },
      { x: 1.65, z: 0.72, scale: 0.75, light: false },
      { x: 2.55, z: -0.35, scale: 0.72, light: false },
      { x: -1.55, z: -2.15, scale: 0.82, light: true },
      { x: -2.95, z: -2.05, scale: 0.82, light: false }
    ];

    const lights: THREE.PointLight[] = [];
    for (const ls of lanternSpecs) {
      const ly = ls.yOverride !== undefined ? ls.yOverride : getTerrainHeight(ls.x, ls.z);
      const lantern = buildStoneLantern(ls.scale);
      lantern.position.set(ls.x, ly - 0.02, ls.z);
      root.add(lantern);

      if (ls.light) {
        const ptLight = new THREE.PointLight('#ffaa44', 0.65, 5.2);
        ptLight.position.set(ls.x, ly + 0.65 * ls.scale, ls.z);
        root.add(ptLight);
        lights.push(ptLight);
      }
    }

    return { archGroup: root, lanternLights: lights };
  }, []);

  useEffect(() => {
    for (const pt of lanternLights) {
      pt.intensity = lanternIntensity;
    }
  }, [lanternIntensity, lanternLights]);

  return <primitive object={archGroup} />;
};

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DioramaState, WATER_PRESETS } from '../types/diorama';
import {
  mapGridToRoundedSquare,
  getTerrainHeight,
  getPerimeterPoints
} from '../utils/noiseAndTerrain';
import {
  WATER_SURFACE_VERT,
  WATER_SURFACE_FRAG,
  WATER_SIDE_VERT,
  WATER_SIDE_FRAG,
  createObstacleUniformArray
} from '../shaders/waterShaders';

interface OceanWaterProps {
  state: DioramaState;
}

export const OceanWater: React.FC<OceanWaterProps> = ({ state }) => {
  const currentWaterLevel = useRef(0.0);
  const fishRefs = useRef<Array<THREE.Group | null>>([]);

  const { waterSurfGeom, waterSideGeom, uniforms, fishData } = useMemo(() => {
    const sharedUniforms = {
      uTime: { value: 0.0 },
      uWaterLevel: { value: 0.0 },
      uWaveHeight: { value: 0.048 },
      uWaveSpeed: { value: 1.0 },
      uClarity: { value: 1.15 },
      uFoamIntensity: { value: 0.88 },
      uNightMix: { value: 0.0 },
      uShallowColor: { value: new THREE.Color('#5ee0d4') },
      uDeepColor: { value: new THREE.Color('#096575') },
      uSkyColor: { value: new THREE.Color('#f4efe6') },
      uSunDir: { value: new THREE.Vector3(14, 22, 12).normalize() },
      uSunColor: { value: new THREE.Color('#fff7e8') },
      uObstaclePos: { value: createObstacleUniformArray() }
    };

    const segs = 144;
    const segs1 = segs + 1;
    const wPos: number[] = [];
    const wNorm: number[] = [];
    const wUv: number[] = [];
    const wTerrH: number[] = [];
    const wIdx: number[] = [];

    for (let iz = 0; iz <= segs; iz++) {
      const v = (iz / segs) * 2 - 1;
      for (let ix = 0; ix <= segs; ix++) {
        const u = (ix / segs) * 2 - 1;
        const pt = mapGridToRoundedSquare(u, v);
        const th = getTerrainHeight(pt.x, pt.z);
        wPos.push(pt.x, 0, pt.z);
        wNorm.push(0, 1, 0);
        wUv.push(ix / segs, iz / segs);
        wTerrH.push(th);
      }
    }
    for (let iz = 0; iz < segs; iz++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = iz * segs1 + ix;
        const b = (iz + 1) * segs1 + ix;
        const c = (iz + 1) * segs1 + (ix + 1);
        const d = iz * segs1 + (ix + 1);
        wIdx.push(a, b, d, b, c, d);
      }
    }

    const surfGeom = new THREE.BufferGeometry();
    surfGeom.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
    surfGeom.setAttribute('normal', new THREE.Float32BufferAttribute(wNorm, 3));
    surfGeom.setAttribute('uv', new THREE.Float32BufferAttribute(wUv, 2));
    surfGeom.setAttribute('aTerrainHeight', new THREE.Float32BufferAttribute(wTerrH, 1));
    surfGeom.setIndex(wIdx);

    // Volumetric Water Side Walls
    const perimPts = getPerimeterPoints(156);
    const sPos: number[] = [];
    const sNorm: number[] = [];
    const sUv: number[] = [];
    const sTerrH: number[] = [];
    const sIdx: number[] = [];
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
      const th = getTerrainHeight(pt.x, pt.z);
      const uCoord = i / pCount;

      sPos.push(pt.x, 0, pt.z);
      sNorm.push(nx, 0, nz);
      sUv.push(uCoord, 1.0);
      sTerrH.push(th);

      sPos.push(pt.x, th, pt.z);
      sNorm.push(nx, 0, nz);
      sUv.push(uCoord, 0.0);
      sTerrH.push(th);
    }

    for (let i = 0; i < pCount; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2 + 1;
      const d = (i + 1) * 2;
      sIdx.push(a, d, b, b, d, c);
    }

    const sideGeom = new THREE.BufferGeometry();
    sideGeom.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    sideGeom.setAttribute('normal', new THREE.Float32BufferAttribute(sNorm, 3));
    sideGeom.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2));
    sideGeom.setAttribute('aTerrainHeight', new THREE.Float32BufferAttribute(sTerrH, 1));
    sideGeom.setIndex(sIdx);

    const fData = [
      { cx: -2.4, cz: 5.2, rx: 1.4, rz: 0.9, speed: 0.55, phase: 0.0, col: '#f56a3f' },
      { cx: -0.2, cz: 5.8, rx: 1.6, rz: 1.1, speed: 0.48, phase: 2.1, col: '#ffffff' },
      { cx: -4.8, cz: 4.5, rx: 1.2, rz: 1.3, speed: 0.62, phase: 4.2, col: '#f7a13e' },
      { cx: 2.4, cz: 5.4, rx: 1.5, rz: 1.0, speed: 0.52, phase: 1.3, col: '#e84830' },
      { cx: -6.2, cz: 1.8, rx: 1.1, rz: 1.4, speed: 0.58, phase: 3.5, col: '#ffffff' },
      { cx: 5.2, cz: 3.8, rx: 1.3, rz: 1.1, speed: 0.50, phase: 5.1, col: '#f5823b' }
    ];

    return {
      waterSurfGeom: surfGeom,
      waterSideGeom: sideGeom,
      uniforms: sharedUniforms,
      fishData: fData
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const elapsed = clock.getElapsedTime();

    currentWaterLevel.current += (state.targetWaterLevel - currentWaterLevel.current) * (1.0 - Math.exp(-4.5 * dt));

    const p = WATER_PRESETS[state.preset];
    uniforms.uTime.value = elapsed;
    uniforms.uWaterLevel.value = currentWaterLevel.current;
    uniforms.uWaveHeight.value = state.waveHeight;
    uniforms.uWaveSpeed.value = state.waveSpeed;
    uniforms.uClarity.value = state.clarity;
    uniforms.uFoamIntensity.value = state.foam;
    uniforms.uNightMix.value = state.dayNightMix;
    uniforms.uShallowColor.value.set(state.shallowColor);
    uniforms.uDeepColor.value.set(state.deepColor);
    uniforms.uSkyColor.value.set(p.skyRefl);
    uniforms.uSunColor.value.set(p.sunColor);

    const elRad = THREE.MathUtils.degToRad(state.sunElevation);
    const azRad = THREE.MathUtils.degToRad(state.sunAzimuth);
    uniforms.uSunDir.value.set(
      Math.cos(elRad) * Math.sin(azRad),
      Math.sin(elRad),
      Math.cos(elRad) * Math.cos(azRad)
    ).normalize();

    const wl = currentWaterLevel.current;
    for (let i = 0; i < fishData.length; i++) {
      const fGroup = fishRefs.current[i];
      if (!fGroup) continue;
      const d = fishData[i];
      const ang = elapsed * d.speed + d.phase;
      const fx = d.cx + Math.cos(ang) * d.rx;
      const fz = d.cz + Math.sin(ang * 1.5) * d.rz;
      const th = getTerrainHeight(fx, fz);
      const targetY = Math.min(wl - 0.10, Math.max(th + 0.08, wl - 0.22));
      fGroup.visible = (wl - th) > 0.16;
      fGroup.position.set(fx, targetY, fz);

      const dx = -Math.sin(ang) * d.rx * d.speed;
      const dz = Math.cos(ang * 1.5) * 1.5 * d.rz * d.speed;
      const yaw = Math.atan2(dx, dz) + Math.sin(elapsed * 8.0 + d.phase) * 0.08;
      fGroup.rotation.set(0, yaw, 0);
    }
  });

  return (
    <group name="OceanWaterGroup">
      <mesh geometry={waterSurfGeom} renderOrder={2}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={WATER_SURFACE_VERT}
          fragmentShader={WATER_SURFACE_FRAG}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={waterSideGeom} renderOrder={3}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={WATER_SIDE_VERT}
          fragmentShader={WATER_SIDE_FRAG}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      <group name="SwimmingKoiFish">
        {fishData.map((fd, idx) => (
          <group key={idx} ref={(el) => { fishRefs.current[idx] = el; }}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[0.65, 1.0, 0.85]}>
              <coneGeometry args={[0.065, 0.28, 8]} />
              <meshStandardMaterial color={fd.col} roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

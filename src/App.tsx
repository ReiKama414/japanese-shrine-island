import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CAMERA_PRESETS,
  CameraViewKey,
  DioramaState,
  PresetKey,
  WATER_PRESETS
} from './types/diorama';
import { IslandTerrain } from './components/IslandTerrain';
import { OceanWater } from './components/OceanWater';
import { ShrineArchitecture } from './components/ShrineArchitecture';
import { PineVegetation } from './components/PineVegetation';
import { ControlBar } from './components/ControlBar';

function lerpColor3(hexDay: string, hexDusk: string, hexNight: string, mix: number): THREE.Color {
  const cDay = new THREE.Color(hexDay);
  const cDusk = new THREE.Color(hexDusk);
  const cNight = new THREE.Color(hexNight);
  if (mix < 0.45) {
    return cDay.lerp(cDusk, mix / 0.45);
  }
  return cDusk.lerp(cNight, (mix - 0.45) / 0.55);
}

const CameraAndDayNightRig: React.FC<{
  state: DioramaState;
  onUpdateDayNightMix: (mix: number) => void;
}> = ({ state, onUpdateDayNightMix }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const targetGoal = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[state.cameraView].target), [state.cameraView]);
  const posGoal = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[state.cameraView].position), [state.cameraView]);
  const isTransitioning = useRef(false);
  const lastView = useRef<CameraViewKey>(state.cameraView);

  if (lastView.current !== state.cameraView) {
    lastView.current = state.cameraView;
    isTransitioning.current = true;
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (controlsRef.current) {
      if (isTransitioning.current) {
        // Smoother cinematic ease toward landmark frames
        const t = 1.0 - Math.exp(-3.6 * dt);
        camera.position.lerp(posGoal, t);
        controlsRef.current.target.lerp(targetGoal, t);
        if (camera.position.distanceTo(posGoal) < 0.05 && controlsRef.current.target.distanceTo(targetGoal) < 0.04) {
          isTransitioning.current = false;
        }
      }
      controlsRef.current.update();
    }

    if (Math.abs(state.dayNightTarget - state.dayNightMix) > 0.0005) {
      const nextMix = state.dayNightMix + (state.dayNightTarget - state.dayNightMix) * (1.0 - Math.exp(-2.8 * dt));
      onUpdateDayNightMix(Math.abs(state.dayNightTarget - nextMix) <= 0.0005 ? state.dayNightTarget : nextMix);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.075}
      autoRotate={state.autoRotate}
      autoRotateSpeed={state.autoRotateSpeed * 4.0}
      minDistance={7.2}
      maxDistance={46.0}
      minPolarAngle={0.14}
      maxPolarAngle={Math.PI * 0.465}
      target={CAMERA_PRESETS.overview.target}
    />
  );
};

export default function App() {
  const [state, setState] = useState<DioramaState>({
    lang: 'zh',
    autoRotate: false,
    autoRotateSpeed: 0.22,
    preset: 'summer',
    isNight: false,
    dayNightTarget: 0.0,
    dayNightMix: 0.0,
    tide: 'high',
    targetWaterLevel: 0.0,
    quality: 'high',
    sunElevation: WATER_PRESETS.summer.sunElevation,
    sunAzimuth: WATER_PRESETS.summer.sunAzimuth,
    waveHeight: 0.048,
    waveSpeed: 1.0,
    clarity: WATER_PRESETS.summer.clarity,
    foam: WATER_PRESETS.summer.foam,
    shallowColor: WATER_PRESETS.summer.shallow,
    deepColor: WATER_PRESETS.summer.deep,
    foliageScale: 1.0,
    fov: 36,
    cameraView: 'overview'
  });

  const handleUpdateState = (patch: Partial<DioramaState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const handleApplyPreset = (presetKey: PresetKey) => {
    const p = WATER_PRESETS[presetKey];
    setState((prev) => ({
      ...prev,
      preset: presetKey,
      sunElevation: p.sunElevation,
      sunAzimuth: p.sunAzimuth,
      clarity: p.clarity,
      foam: p.foam,
      shallowColor: p.shallow,
      deepColor: p.deep
    }));
  };

  const handleSelectCameraView = (view: CameraViewKey) => {
    setState((prev) => ({ ...prev, cameraView: view }));
  };

  const presetConfig = WATER_PRESETS[state.preset];
  const mix = state.dayNightMix;

  const currentBgHex = useMemo(
    () => '#' + lerpColor3(presetConfig.bg, presetConfig.duskBg, presetConfig.nightBg, mix).getHexString(),
    [presetConfig, mix]
  );

  const currentKeyColorHex = useMemo(
    () => '#' + lerpColor3(presetConfig.sunColor, presetConfig.duskSunColor, presetConfig.nightMoonColor, mix).getHexString(),
    [presetConfig, mix]
  );

  const sunPosition = useMemo((): [number, number, number] => {
    const duskDip = Math.sin(mix * Math.PI) * 18.0;
    const elRad = THREE.MathUtils.degToRad(Math.max(14, state.sunElevation - duskDip));
    const azRad = THREE.MathUtils.degToRad(state.sunAzimuth + mix * 28.0);
    const r = 28.0;
    return [
      r * Math.cos(elRad) * Math.sin(azRad),
      r * Math.sin(elRad),
      r * Math.cos(elRad) * Math.cos(azRad)
    ];
  }, [state.sunElevation, state.sunAzimuth, mix]);

  const dpr: [number, number] =
    state.quality === 'low'
      ? [1, 1]
      : state.quality === 'medium'
      ? [1, 1.25]
      : state.quality === 'high'
      ? [1, 1.75]
      : [1, 2];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none transition-[background-color] duration-700 ease-out"
      style={{ backgroundColor: currentBgHex }}
    >
      <Canvas
        shadows={state.quality !== 'low'}
        dpr={dpr}
        camera={{
          position: CAMERA_PRESETS.overview.position,
          fov: state.fov,
          near: 0.2,
          far: 150
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.02
        }}
      >
        <color attach="background" args={[currentBgHex]} />
        <fogExp2 attach="fog" args={[currentBgHex, 0.0045]} />

        <ambientLight
          color={mix > 0.5 ? '#344d78' : '#fffaf2'}
          intensity={THREE.MathUtils.lerp(presetConfig.ambientIntensity, 0.34, mix)}
        />
        <hemisphereLight
          args={[
            mix > 0.5 ? '#2c4470' : '#fffdf8',
            mix > 0.5 ? '#121c2d' : '#688273',
            THREE.MathUtils.lerp(presetConfig.hemiIntensity, 0.38, mix)
          ]}
          position={[0, 25, 0]}
        />
        <directionalLight
          color={currentKeyColorHex}
          intensity={THREE.MathUtils.lerp(presetConfig.sunIntensity, 0.54, mix)}
          position={sunPosition}
          castShadow={state.quality !== 'low'}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-bias={-0.0005}
        />
        <directionalLight
          color={mix > 0.5 ? '#284678' : '#bfe6eb'}
          intensity={THREE.MathUtils.lerp(0.36, 0.22, mix)}
          position={[-16, 12, -14]}
        />

        <group name="JapaneseShrineIslandDiorama">
          <IslandTerrain />
          <ShrineArchitecture
            lanternIntensity={THREE.MathUtils.lerp(presetConfig.lanternIntensity, 2.35, mix)}
          />
          <PineVegetation foliageScale={state.foliageScale} />
          <OceanWater state={state} />
        </group>

        <CameraAndDayNightRig
          state={state}
          onUpdateDayNightMix={(nextMix) => handleUpdateState({ dayNightMix: nextMix })}
        />
      </Canvas>

      <ControlBar
        state={state}
        onUpdateState={handleUpdateState}
        onApplyPreset={handleApplyPreset}
        onSelectCameraView={handleSelectCameraView}
      />
    </div>
  );
}

export type PresetKey = 'summer' | 'cobalt' | 'emerald' | 'sakura';
export type TideMode = 'high' | 'low';
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';
export type CameraViewKey = 'overview' | 'torii' | 'shrine' | 'pagoda' | 'topdown';
export type LanguageKey = 'zh' | 'en' | 'ja';

export interface WaterPresetConfig {
  name: string;
  swatch: string;
  bg: string;
  duskBg: string;
  nightBg: string;
  shallow: string;
  nightShallow: string;
  deep: string;
  nightDeep: string;
  skyRefl: string;
  nightSkyRefl: string;
  sunColor: string;
  duskSunColor: string;
  nightMoonColor: string;
  sunIntensity: number;
  sunElevation: number;
  sunAzimuth: number;
  ambientIntensity: number;
  hemiIntensity: number;
  clarity: number;
  foam: number;
  lanternIntensity: number;
}

export interface DioramaState {
  lang: LanguageKey;
  autoRotate: boolean;
  autoRotateSpeed: number;
  preset: PresetKey;
  isNight: boolean;
  dayNightTarget: number;
  dayNightMix: number;
  tide: TideMode;
  targetWaterLevel: number;
  quality: QualityLevel;
  sunElevation: number;
  sunAzimuth: number;
  waveHeight: number;
  waveSpeed: number;
  clarity: number;
  foam: number;
  shallowColor: string;
  deepColor: string;
  foliageScale: number;
  fov: number;
  cameraView: CameraViewKey;
}

export const I18N_DICT: Record<LanguageKey, Record<string, string>> = {
  en: {
    langName: 'English',
    cam_overview: 'Overview',
    cam_torii: 'O-Torii',
    cam_shrine: 'Shrine',
    cam_pagoda: 'Pagoda',
    cam_topdown: 'Aerial',
    reset: 'Reset',
    autoRotate: 'Auto Rotate',
    day: 'Day',
    night: 'Night',
    highTide: 'High Tide',
    lowTide: 'Low Tide',
    qualityPrefix: 'Quality:',
    q_low: 'Low',
    q_medium: 'Medium',
    q_high: 'High',
    q_ultra: 'Ultra',
    tune: 'Tune',
    tuneTitle: 'Diorama Studio Tune',
    secPreset: 'Water & Season Preset',
    secDayNight: 'Day & Night Cycle',
    secWater: 'Water & Tide',
    secLight: 'Lighting & Island',
    preset_summer: 'Summer',
    preset_cobalt: 'Cobalt',
    preset_emerald: 'Emerald',
    preset_sakura: 'Sakura',
    lblDayNightMix: 'Time Transition',
    lblWaterLevel: 'Tide Level',
    lblWaveHeight: 'Wave Amplitude',
    lblClarity: 'Water Clarity',
    lblFoam: 'Shoreline Foam',
    lblShallow: 'Shallow',
    lblDeep: 'Deep',
    lblSunEl: 'Sun / Moon Altitude',
    lblSunAz: 'Celestial Azimuth',
    lblFoliage: 'Pine Canopy Height',
    lblFov: 'Camera Lens FOV'
  },
  zh: {
    langName: '繁體中文',
    cam_overview: '全景總覽',
    cam_torii: '水中大鳥居',
    cam_shrine: '浮水神社',
    cam_pagoda: '五重塔',
    cam_topdown: '俯瞰視角',
    reset: '重置視角',
    autoRotate: '自動旋轉',
    day: '白天',
    night: '黑夜',
    highTide: '滿潮',
    lowTide: '退潮',
    qualityPrefix: '畫質：',
    q_low: '低',
    q_medium: '中',
    q_high: '高',
    q_ultra: '極致',
    tune: '微調',
    tuneTitle: '微縮模型工作室調校',
    secPreset: '季節與水色氛圍',
    secDayNight: '晝夜光影過渡',
    secWater: '水體與潮汐設定',
    secLight: '光照與島嶼植被',
    preset_summer: '盛夏礁湖',
    preset_cobalt: '鈷藍深海',
    preset_emerald: '翡翠秘境',
    preset_sakura: '櫻色薄暮',
    lblDayNightMix: '晝夜過渡進度',
    lblWaterLevel: '潮汐水位',
    lblWaveHeight: '波浪振幅',
    lblClarity: '水質清澈度',
    lblFoam: '岸際浪花',
    lblShallow: '淺灘水色',
    lblDeep: '深海水色',
    lblSunEl: '日月仰角',
    lblSunAz: '光源方位角',
    lblFoliage: '松林樹冠高度',
    lblFov: '鏡頭視角 FOV'
  },
  ja: {
    langName: '日本語',
    cam_overview: '全景',
    cam_torii: '大鳥居',
    cam_shrine: '社殿',
    cam_pagoda: '五重塔',
    cam_topdown: '俯瞰',
    reset: 'リセット',
    autoRotate: '自動回転',
    day: '昼',
    night: '夜',
    highTide: '満潮',
    lowTide: '干潮',
    qualityPrefix: '画質：',
    q_low: '低',
    q_medium: '中',
    q_high: '高',
    q_ultra: '最高',
    tune: '調整',
    tuneTitle: 'ジオラマ環境チューニング',
    secPreset: '季節・水色プリセット',
    secDayNight: '昼夜サイクル遷移',
    secWater: '水面・潮汐設定',
    secLight: '照明・植生設定',
    preset_summer: '夏礁',
    preset_cobalt: '群青',
    preset_emerald: '翡翠',
    preset_sakura: '桜宵',
    lblDayNightMix: '昼夜遷移',
    lblWaterLevel: '潮位レベル',
    lblWaveHeight: '波の振幅',
    lblClarity: '水の透明度',
    lblFoam: '波打ち際の泡',
    lblShallow: '浅瀬の色',
    lblDeep: '深海の色',
    lblSunEl: '太陽・月の高度',
    lblSunAz: '光源の方位角',
    lblFoliage: '松林の高さ',
    lblFov: 'カメラ視野角'
  }
};

export const WATER_PRESETS: Record<PresetKey, WaterPresetConfig> = {
  summer: {
    name: 'Summer',
    swatch: '#5ee0d4',
    bg: '#ede8df',
    duskBg: '#332838',
    nightBg: '#0d1422',
    shallow: '#5ee0d4',
    nightShallow: '#1b627c',
    deep: '#096575',
    nightDeep: '#051f36',
    skyRefl: '#f4efe6',
    nightSkyRefl: '#1b2b48',
    sunColor: '#fff6e5',
    duskSunColor: '#ff944d',
    nightMoonColor: '#8cb6ff',
    sunIntensity: 1.22,
    sunElevation: 48,
    sunAzimuth: 36,
    ambientIntensity: 0.65,
    hemiIntensity: 0.68,
    clarity: 1.15,
    foam: 0.92,
    lanternIntensity: 0.55
  },
  cobalt: {
    name: 'Cobalt',
    swatch: '#2b6fd6',
    bg: '#ebe6dc',
    duskBg: '#2b263d',
    nightBg: '#0a1020',
    shallow: '#2b6fd6',
    nightShallow: '#18428a',
    deep: '#082975',
    nightDeep: '#041238',
    skyRefl: '#dce8fa',
    nightSkyRefl: '#162444',
    sunColor: '#ffffff',
    duskSunColor: '#ff8855',
    nightMoonColor: '#94beff',
    sunIntensity: 1.28,
    sunElevation: 54,
    sunAzimuth: 28,
    ambientIntensity: 0.68,
    hemiIntensity: 0.72,
    clarity: 0.95,
    foam: 0.96,
    lanternIntensity: 0.45
  },
  emerald: {
    name: 'Emerald',
    swatch: '#34cfa2',
    bg: '#eee9df',
    duskBg: '#283335',
    nightBg: '#0b171b',
    shallow: '#34cfa2',
    nightShallow: '#156658',
    deep: '#065745',
    nightDeep: '#03241f',
    skyRefl: '#e8f5ee',
    nightSkyRefl: '#152e2d',
    sunColor: '#fff5e0',
    duskSunColor: '#ff9e58',
    nightMoonColor: '#82d4bb',
    sunIntensity: 1.18,
    sunElevation: 44,
    sunAzimuth: 42,
    ambientIntensity: 0.64,
    hemiIntensity: 0.66,
    clarity: 1.22,
    foam: 0.88,
    lanternIntensity: 0.60
  },
  sakura: {
    name: 'Sakura',
    swatch: '#cfa0d6',
    bg: '#efe7e3',
    duskBg: '#3b2638',
    nightBg: '#141124',
    shallow: '#cfa0d6',
    nightShallow: '#583e7a',
    deep: '#5c5899',
    nightDeep: '#1d1942',
    skyRefl: '#f7e1ea',
    nightSkyRefl: '#2c1f3d',
    sunColor: '#ffd9c2',
    duskSunColor: '#ff7b6b',
    nightMoonColor: '#c4a6ff',
    sunIntensity: 1.08,
    sunElevation: 28,
    sunAzimuth: 52,
    ambientIntensity: 0.62,
    hemiIntensity: 0.64,
    clarity: 1.30,
    foam: 0.82,
    lanternIntensity: 1.25
  }
};

export const CAMERA_PRESETS: Record<CameraViewKey, { position: [number, number, number]; target: [number, number, number] }> = {
  overview: { position: [-21.0, 20.8, 29.5], target: [0.0, -1.35, 1.35] },
  torii:    { position: [-5.6, 3.8, 12.2],   target: [-1.35, 0.75, 2.05] },
  shrine:   { position: [-4.2, 5.4, 13.5],   target: [-0.35, 0.95, 0.05] },
  pagoda:   { position: [-11.8, 8.2, 8.6],   target: [-1.85, 2.25, -2.15] },
  topdown:  { position: [-4.2, 33.5, 6.2],   target: [0.0, 0.2, 0.0] }
};

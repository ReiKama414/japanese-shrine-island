import React, { useEffect, useState } from 'react';
import { ChevronDown, Github, Globe, Maximize2, X } from 'lucide-react';
import {
  CameraViewKey,
  DioramaState,
  I18N_DICT,
  LanguageKey,
  PresetKey,
  QualityLevel,
  WATER_PRESETS
} from '../types/diorama';

interface ControlBarProps {
  state: DioramaState;
  onUpdateState: (patch: Partial<DioramaState>) => void;
  onApplyPreset: (preset: PresetKey) => void;
  onSelectCameraView: (view: CameraViewKey) => void;
}

type MenuKey = 'preset' | 'quality' | 'lang';

const SITE_URL = 'https://reikama414.vercel.app/';
const GITHUB_URL = 'https://github.com/ReiKama414/japanese-shrine-island';

export const ControlBar: React.FC<ControlBarProps> = ({
  state,
  onUpdateState,
  onApplyPreset,
  onSelectCameraView
}) => {
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tuneVisible, setTuneVisible] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const dict = I18N_DICT[state.lang] || I18N_DICT.zh;
  const isNightUI = state.dayNightMix > 0.52;

  useEffect(() => {
    if (openMenu) {
      const id = requestAnimationFrame(() => setMenuVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setMenuVisible(false);
  }, [openMenu]);

  useEffect(() => {
    if (tuneOpen) {
      const id = requestAnimationFrame(() => setTuneVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setTuneVisible(false);
  }, [tuneOpen]);

  const toggleMenu = (m: MenuKey) => {
    setOpenMenu((prev) => (prev === m ? null : m));
  };

  const closeMenu = () => {
    setMenuVisible(false);
    window.setTimeout(() => setOpenMenu(null), 160);
  };

  const closeTune = () => {
    setTuneVisible(false);
    window.setTimeout(() => setTuneOpen(false), 220);
  };

  const toggleDayNight = () => {
    const nextNight = !state.isNight;
    onUpdateState({
      isNight: nextNight,
      dayNightTarget: nextNight ? 1.0 : 0.0
    });
  };

  const toggleTide = () => {
    if (state.tide === 'high') {
      onUpdateState({ tide: 'low', targetWaterLevel: -0.34 });
    } else {
      onUpdateState({ tide: 'high', targetWaterLevel: 0.0 });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const glassClass = isNightUI
    ? 'bg-[#131a2a]/90 text-slate-100 border-blue-300/20 shadow-2xl'
    : 'bg-[#fcf9f4]/90 text-stone-800 border-stone-900/10 shadow-xl';

  const sliderClass = isNightUI ? 'diorama-slider diorama-slider-night' : 'diorama-slider';

  const dropdownPanelClass = `absolute p-1.5 rounded-xl backdrop-blur-md border origin-top transition-all duration-200 ease-out ${glassClass} ${
    menuVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
  }`;

  const dropdownPanelUpClass = `absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 p-1.5 rounded-xl backdrop-blur-md border origin-bottom transition-all duration-200 ease-out ${glassClass} ${
    menuVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
  }`;

  const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
    <ChevronDown
      size={12}
      strokeWidth={2.25}
      className={`opacity-55 transition-transform duration-200 ease-out ${open ? 'rotate-180' : 'rotate-0'}`}
      aria-hidden
    />
  );

  return (
    <>
      {/* Top-Left Landmark Camera Framing Pills */}
      <div
        className={`fixed top-4 left-4 z-10 flex items-center gap-1 p-1 rounded-full backdrop-blur-md border transition-colors duration-500 ${glassClass}`}
      >
        {(['overview', 'torii', 'shrine', 'pagoda', 'topdown'] as CameraViewKey[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelectCameraView(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              state.cameraView === v
                ? isNightUI
                  ? 'bg-[#3a445c] text-slate-100 shadow-sm'
                  : 'bg-stone-800 text-stone-50 shadow-sm'
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            {dict[`cam_${v}`]}
          </button>
        ))}
      </div>

      {/* Top-Right Language only */}
      <div className="fixed top-4 right-4 z-30">
        <div className="relative">
          <div className={`p-1 rounded-full backdrop-blur-md border transition-colors duration-500 ${glassClass}`}>
            <button
              type="button"
              onClick={() => toggleMenu('lang')}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
              aria-expanded={openMenu === 'lang'}
            >
              <Globe size={13} strokeWidth={2} className="opacity-70" aria-hidden />
              <span>{dict.langName}</span>
              <Chevron open={openMenu === 'lang'} />
            </button>
          </div>
          {openMenu === 'lang' && (
            <div className={`${dropdownPanelClass} right-0 mt-2 w-36`}>
              {(['zh', 'en', 'ja'] as LanguageKey[]).map((lKey) => (
                <button
                  key={lKey}
                  type="button"
                  onClick={() => {
                    onUpdateState({ lang: lKey });
                    closeMenu();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    state.lang === lKey
                      ? isNightUI
                        ? 'bg-white/12 font-semibold'
                        : 'bg-[#a85a42]/14 font-semibold'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span>{I18N_DICT[lKey].langName}</span>
                  {state.lang === lKey && <span className="text-[9px] opacity-70">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom-left: Gemini credit */}
      <div className="fixed bottom-3 left-3 z-10 text-[7px] tracking-wider opacity-[0.22] pointer-events-none">
        Made with Gemini 4
      </div>

      {/* Bottom-right: GitHub + site icons, stacked */}
      <div className="fixed bottom-3 right-3 z-10 flex flex-col items-center gap-1">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 opacity-[0.28] hover:opacity-75 transition-opacity duration-300"
          title="GitHub — ReiKama414"
          aria-label="GitHub — ReiKama414"
        >
          <Github size={13} strokeWidth={1.6} />
        </a>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 opacity-[0.28] hover:opacity-75 transition-opacity duration-300"
          title="reikama414.vercel.app"
          aria-label="Personal site"
        >
          <Globe size={13} strokeWidth={1.6} />
        </a>
      </div>

      {/* Expandable Right-Side Tune Drawer */}
      {tuneOpen && (
        <aside
          className={`fixed top-16 right-4 bottom-20 w-72 z-20 rounded-2xl backdrop-blur-md border flex flex-col overflow-hidden transition-all duration-300 ease-out ${glassClass} ${
            tuneVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">{dict.tuneTitle}</h2>
            </div>
            <button
              type="button"
              onClick={closeTune}
              className="opacity-60 hover:opacity-100 p-1 rounded-md transition-opacity"
              aria-label="Close"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-2">
                {dict.secPreset}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['summer', 'cobalt', 'emerald', 'sakura'] as PresetKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onApplyPreset(k)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                      state.preset === k
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white/10 border-current/10 hover:bg-white/20'
                    }`}
                  >
                    {dict[`preset_${k}`]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-current/10">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                {dict.secDayNight}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{dict.lblDayNightMix}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    {Math.round(state.dayNightMix * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={state.dayNightMix}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onUpdateState({ dayNightTarget: v, dayNightMix: v, isNight: v > 0.5 });
                  }}
                  className={sliderClass}
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-current/10">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                {dict.secWater}
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{dict.lblWaterLevel}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    {state.targetWaterLevel.toFixed(2)}m
                  </span>
                </div>
                <input
                  type="range"
                  min={-0.54}
                  max={0.18}
                  step={0.01}
                  value={state.targetWaterLevel}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onUpdateState({ targetWaterLevel: v, tide: v < -0.2 ? 'low' : 'high' });
                  }}
                  className={sliderClass}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{dict.lblWaveHeight}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    {state.waveHeight.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.005}
                  max={0.12}
                  step={0.005}
                  value={state.waveHeight}
                  onChange={(e) => onUpdateState({ waveHeight: parseFloat(e.target.value) })}
                  className={sliderClass}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{dict.lblClarity}</span>
                  <span className="font-mono text-[11px] opacity-70">{state.clarity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.0}
                  step={0.05}
                  value={state.clarity}
                  onChange={(e) => onUpdateState({ clarity: parseFloat(e.target.value) })}
                  className={sliderClass}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{dict.lblFoam}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    {Math.round(state.foam * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.5}
                  step={0.05}
                  value={state.foam}
                  onChange={(e) => onUpdateState({ foam: parseFloat(e.target.value) })}
                  className={sliderClass}
                />
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Floating Control Bar */}
      <nav
        aria-label="Diorama Controls"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1.5 rounded-full backdrop-blur-md border max-w-[96vw] transition-colors duration-500 ${glassClass}`}
      >
        <button
          type="button"
          onClick={() => onSelectCameraView('overview')}
          className="px-3 py-1.5 rounded-full text-xs font-medium opacity-85 hover:opacity-100 transition-all duration-200"
        >
          {dict.reset}
        </button>

        <button
          type="button"
          onClick={() => onUpdateState({ autoRotate: !state.autoRotate })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            state.autoRotate ? 'bg-stone-900 text-white shadow-sm' : 'opacity-85 hover:opacity-100'
          }`}
        >
          {dict.autoRotate}
        </button>

        <div className="h-4 w-px bg-current/15 mx-0.5" />

        <button
          type="button"
          onClick={toggleDayNight}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-300 ${
            state.isNight
              ? 'bg-[#3a445c] text-slate-100 shadow-sm ring-1 ring-slate-400/25'
              : 'opacity-85 hover:opacity-100'
          }`}
        >
          <span className="transition-transform duration-300">{state.isNight ? '🌙' : '☀️'}</span>
          <span>{state.isNight ? dict.night : dict.day}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('preset')}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 opacity-85 hover:opacity-100 transition-all duration-200"
            aria-expanded={openMenu === 'preset'}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block transition-colors duration-300"
              style={{ backgroundColor: WATER_PRESETS[state.preset].swatch }}
            />
            <span>{dict[`preset_${state.preset}`]}</span>
            <Chevron open={openMenu === 'preset'} />
          </button>

          {openMenu === 'preset' && (
            <div className={`${dropdownPanelUpClass} w-40`}>
              {(['summer', 'cobalt', 'emerald', 'sakura'] as PresetKey[]).map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => {
                    onApplyPreset(pKey);
                    closeMenu();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    state.preset === pKey
                      ? isNightUI
                        ? 'bg-white/12 font-semibold'
                        : 'bg-[#a85a42]/14 font-semibold'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: WATER_PRESETS[pKey].swatch }}
                    />
                    <span>{dict[`preset_${pKey}`]}</span>
                  </span>
                  {state.preset === pKey && <span className="text-[9px] opacity-70">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTide}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            state.tide === 'low' ? 'bg-stone-900 text-white shadow-sm' : 'opacity-85 hover:opacity-100'
          }`}
        >
          {state.tide === 'low' ? dict.lowTide : dict.highTide}
        </button>

        <div className="h-4 w-px bg-current/15 mx-0.5" />

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('quality')}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 opacity-85 hover:opacity-100 transition-all duration-200"
            aria-expanded={openMenu === 'quality'}
          >
            <span className="opacity-65">{dict.qualityPrefix}</span>
            <span className="font-semibold">{dict[`q_${state.quality}`]}</span>
            <Chevron open={openMenu === 'quality'} />
          </button>

          {openMenu === 'quality' && (
            <div className={`${dropdownPanelUpClass} w-36`}>
              {(['low', 'medium', 'high', 'ultra'] as QualityLevel[]).map((qKey) => (
                <button
                  key={qKey}
                  type="button"
                  onClick={() => {
                    onUpdateState({ quality: qKey });
                    closeMenu();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    state.quality === qKey
                      ? isNightUI
                        ? 'bg-white/12 font-semibold'
                        : 'bg-[#a85a42]/14 font-semibold'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span>{dict[`q_${qKey}`]}</span>
                  {state.quality === qKey && <span className="text-[9px] opacity-70">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => (tuneOpen ? closeTune() : setTuneOpen(true))}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            tuneOpen ? 'bg-stone-900 text-white shadow-sm' : 'opacity-85 hover:opacity-100'
          }`}
        >
          {dict.tune}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="px-2.5 py-1.5 rounded-full text-xs font-medium opacity-85 hover:opacity-100 transition-all duration-200"
          title="Fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize2 size={13} strokeWidth={2} />
        </button>
      </nav>
    </>
  );
};

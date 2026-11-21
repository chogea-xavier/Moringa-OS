import React, { useState } from 'react';
import {
  Cpu,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Moon,
  Server,
  Shield,
  Sun,
  Touchpad,
  Usb,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  ASSET_PATHS,
  DEVICE_PROFILES,
} from '../data/osCatalog';
import {
  DeviceProfileId,
  InputMode,
  OsView,
  ThemeMode,
} from '../types/os';

interface SystemOverviewProps {
  deviceProfile: DeviceProfileId;
  onDeviceProfileChange: (profile: DeviceProfileId) => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (theme: ThemeMode) => void;
  onNavigate: (view: OsView) => void;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({
  deviceProfile,
  onDeviceProfileChange,
  inputMode,
  onInputModeChange,
  themeMode,
  onThemeModeChange,
  onNavigate,
}) => {
  const [wallpaperError, setWallpaperError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const activeProfile = DEVICE_PROFILES[deviceProfile];
  const isTouch = inputMode === 'touch';

  const wallpaperSrc =
    themeMode === 'dark' ? ASSET_PATHS.wallpaperDark : ASSET_PATHS.wallpaperLight;

  const btnHeight = isTouch ? 'min-h-[44px] px-4 py-2.5' : 'min-h-[38px] px-4 py-2';

  return (
    <div className="space-y-10">
      {/* Workspace Adaptive Controls Bar (Placed below Top Bar per Top Bar Contract) */}
      <section
        aria-label="Hardware and Input Adaptation Controls"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/90 pb-5"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Device Profile
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {(['desktop', 'laptop', 'workstation'] as DeviceProfileId[]).map((id) => {
                const Icon = id === 'desktop' ? Monitor : id === 'laptop' ? Laptop : Server;
                const active = deviceProfile === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onDeviceProfileChange(id)}
                    className={`inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                      isTouch ? 'min-h-[44px] px-3.5' : 'min-h-[32px] px-3'
                    } ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{DEVICE_PROFILES[id].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Input Mode
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onInputModeChange('keyboard')}
                className={`inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isTouch ? 'min-h-[44px] px-3.5' : 'min-h-[32px] px-3'
                } ${
                  inputMode === 'keyboard'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Keyboard</span>
              </button>
              <button
                type="button"
                onClick={() => onInputModeChange('touch')}
                className={`inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isTouch ? 'min-h-[44px] px-3.5' : 'min-h-[32px] px-3'
                } ${
                  inputMode === 'touch'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Touchpad className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Touch</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onThemeModeChange(themeMode === 'dark' ? 'light' : 'dark')}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
            isTouch ? 'min-h-[44px] px-4' : 'min-h-[36px] px-3.5'
          }`}
        >
          {themeMode === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </section>

      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Wrld Tech</span>
              <span aria-hidden="true">·</span>
              <span>Lead Architect: Wrld Xavier</span>
              <span aria-hidden="true">·</span>
              <span>Linux · Windows · macOS Compatibility</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] text-balance">
              One portable operating system across every ecosystem and device.
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-[65ch]">
              Moringa OS unifies native Linux execution with isolated Windows and macOS
              translation bridges inside a hardened virtual sandbox. Built for tech institution
              labs (Cybersecurity CTF, Software Engineering, Data Science) with Docker, Kubernetes,
              live USB boot, and modern device installation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('monitor')}
              className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${btnHeight}`}
            >
              <Cpu className="w-4 h-4" aria-hidden="true" />
              <span>Open System Monitor</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sandbox')}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${btnHeight}`}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Virtual Sandbox</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('usb')}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${btnHeight}`}
            >
              <Usb className="w-4 h-4" aria-hidden="true" />
              <span>Bootable USB</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('compatibility')}
              className={`inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                isTouch ? 'min-h-[44px] px-2' : 'px-2 py-1.5'
              }`}
            >
              <span>Inspect App Bridges</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right Hero Focal Visual: Active OS Wallpaper & Profile Surface */}
        <div className="lg:col-span-6">
          <div className="relative h-full min-h-[300px] lg:min-h-[340px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
            {!wallpaperError ? (
              <img
                src={wallpaperSrc}
                alt="Moringa OS botanical slate desktop environment surface"
                referrerPolicy="no-referrer"
                onError={() => setWallpaperError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950/50 to-slate-950 text-slate-200 p-8">
                <Cpu className="w-10 h-10 mb-3 text-emerald-500" />
                <p className="font-display text-lg font-semibold">Moringa OS Wayland Surface</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span>Active Profile: {activeProfile.label}</span>
                <span aria-hidden="true">·</span>
                <span>Input: {inputMode === 'touch' ? 'Touch (44px+)' : 'Keyboard (Chords)'}</span>
                <span aria-hidden="true">·</span>
                <span>Kernel 6.12 LTS</span>
              </div>
              <p className="text-sm text-slate-100 font-medium">{activeProfile.targetSummary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Hardware Metrics Strip */}
      <section aria-label="Active Device Specifications" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">CPU Governor</p>
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {activeProfile.cpuGovernor}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Memory Addressing</p>
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {activeProfile.memoryCeiling}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Power Policy</p>
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {activeProfile.powerProfile}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Display Pipeline</p>
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {activeProfile.displayScaling}
          </p>
        </div>
      </section>

      {/* Hardware Support Matrix Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              Seamless Hardware Support — {activeProfile.label}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {activeProfile.inputNotes}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('terminal')}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
          >
            Run hardware-probe in Terminal
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-5">Subsystem</th>
                <th className="py-3 px-5">Kernel &amp; Userspace Stack</th>
                <th className="py-3 px-5">Hardware Capability</th>
                <th className="py-3 px-5 text-right">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {activeProfile.hardwareMatrix.map((row) => (
                <tr
                  key={row.subsystem}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-slate-100">
                    {row.subsystem}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {row.driverStack}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300">
                    {row.capability}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Developer & Organization Attribution Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-800 shrink-0">
            {!avatarError ? (
              <img
                src={ASSET_PATHS.developerAvatar}
                alt="Wrld Xavier, Lead Developer of Moringa OS at Wrld Tech"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-200">
                WX
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Developer Attribution</span>
              <span aria-hidden="true">·</span>
              <span>Wrld Tech</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Engineered by Wrld Xavier at Wrld Tech
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Full architectural documentation, build recipes, and USB flashing guides are bundled
              in <span className="font-mono text-slate-800 dark:text-slate-200">README.md</span>{' '}
              for direct GitHub publishing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('docs')}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${btnHeight}`}
        >
          <HardDrive className="w-4 h-4" aria-hidden="true" />
          <span>View GitHub README</span>
        </button>
      </section>
    </div>
  );
};

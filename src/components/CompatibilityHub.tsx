import React, { useMemo, useRef, useState } from 'react';
import {
  FileCode2,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Terminal,
  Upload,
  X,
} from 'lucide-react';
import { CROSS_PLATFORM_APPS } from '../data/osCatalog';
import {
  CrossPlatformApp,
  InputMode,
  PlatformOrigin,
} from '../types/os';

interface CompatibilityHubProps {
  inputMode: InputMode;
  onLaunchInSandbox: (presetCode: string, label: string) => void;
}

interface BinaryInspectionResult {
  fileName: string;
  sizeBytes: number;
  hexPreview: string;
  detectedPlatform: string;
  recommendedBridge: string;
}

function detectBinaryHeader(bytes: Uint8Array, fileName: string): Omit<BinaryInspectionResult, 'fileName' | 'sizeBytes'> {
  const hexPreview = Array.from(bytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  if (bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
    return {
      hexPreview,
      detectedPlatform: 'Linux ELF Executable / Shared Object',
      recommendedBridge: 'Native Linux Kernel + Bubblewrap Sandbox',
    };
  }
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return {
      hexPreview,
      detectedPlatform: 'Windows PE32 / PE64 Executable (.exe / .dll)',
      recommendedBridge: 'WinBridge (Wine 9.x + DXVK Isolated Prefix)',
    };
  }
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0xcf && bytes[1] === 0xfa && bytes[2] === 0xed && bytes[3] === 0xfe) ||
      (bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfa && bytes[3] === 0xcf) ||
      (bytes[0] === 0xca && bytes[1] === 0xfe && bytes[2] === 0xba && bytes[3] === 0xbe))
  ) {
    return {
      hexPreview,
      detectedPlatform: 'macOS Mach-O / Universal Binary',
      recommendedBridge: 'DarwinBridge (Darling Userspace Mach Shim)',
    };
  }
  if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) {
    return {
      hexPreview,
      detectedPlatform: 'WebAssembly Portable Module (.wasm)',
      recommendedBridge: 'Moringa WASI / Browser Isolated Runtime',
    };
  }
  if (fileName.endsWith('.dmg') || fileName.endsWith('.app')) {
    return {
      hexPreview,
      detectedPlatform: 'macOS Disk Image / App Bundle',
      recommendedBridge: 'DarwinBridge Archive Mount + Sandbox',
    };
  }
  if (fileName.endsWith('.AppImage')) {
    return {
      hexPreview,
      detectedPlatform: 'Linux Portable AppImage',
      recommendedBridge: 'FUSE3 Unprivileged Mount + Seccomp',
    };
  }

  return {
    hexPreview: hexPreview || 'Empty file',
    detectedPlatform: 'Portable Script or Data Artifact',
    recommendedBridge: 'Moringa Virtual Sandbox Text/Script Runner',
  };
}

export const CompatibilityHub: React.FC<CompatibilityHubProps> = ({
  inputMode,
  onLaunchInSandbox,
}) => {
  const [filter, setFilter] = useState<'all' | PlatformOrigin>('all');
  const [search, setSearch] = useState('');
  const [sandboxPolicies, setSandboxPolicies] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CROSS_PLATFORM_APPS.map((a) => [a.id, a.sandboxDefault]))
  );
  const [selectedApp, setSelectedApp] = useState<CrossPlatformApp>(CROSS_PLATFORM_APPS[0]);
  const [runningApp, setRunningApp] = useState<CrossPlatformApp | null>(null);
  const [inspection, setInspection] = useState<BinaryInspectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTouch = inputMode === 'touch';
  const controlHeight = isTouch ? 'min-h-[44px]' : 'min-h-[36px]';

  const filteredApps = useMemo(() => {
    return CROSS_PLATFORM_APPS.filter((app) => {
      const matchesPlatform = filter === 'all' || app.origin === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.bridgeEngine.toLowerCase().includes(q) ||
        app.binaryFormat.toLowerCase().includes(q);
      return matchesPlatform && matchesSearch;
    });
  }, [filter, search]);

  const handleFileInspect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer.slice(0, 64));
      const detected = detectBinaryHeader(bytes, file.name);
      setInspection({
        fileName: file.name,
        sizeBytes: file.size,
        ...detected,
      });
    };
    reader.readAsArrayBuffer(file.slice(0, 64));
  };

  const toggleAppSandbox = (id: string) => {
    setSandboxPolicies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Cross-Platform Application Compatibility
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Run Linux ELF, Windows PE64, and macOS Mach-O binaries side-by-side with isolated
            syscall translation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'All Ecosystems' },
                { id: 'linux', label: 'Linux' },
                { id: 'windows', label: 'Windows' },
                { id: 'macos', label: 'macOS' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 px-3 ${
                  isTouch ? 'min-h-[44px]' : 'min-h-[32px]'
                } ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runtime or format..."
              aria-label="Search cross-platform applications"
              className={`pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-emerald-600 ${controlHeight}`}
            />
          </div>
        </div>
      </div>

      {/* Main Split: App Compatibility Table + Selected Syscall Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
          {filteredApps.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No compatible applications match "{search}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSearch('');
                }}
                className={`inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 ${controlHeight}`}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Origin &amp; Format</th>
                  <th className="py-3 px-4">Translation Bridge</th>
                  <th className="py-3 px-4 text-right">Sandbox</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                {filteredApps.map((app) => {
                  const isSelected = selectedApp.id === app.id;
                  const sandboxed = sandboxPolicies[app.id];
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{app.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {app.developer} · v{app.version}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="capitalize text-slate-800 dark:text-slate-200 font-medium">
                          {app.origin}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {app.binaryFormat}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                        {app.bridgeEngine}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAppSandbox(app.id)}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                            isTouch ? 'min-h-[40px]' : 'min-h-[30px]'
                          } ${
                            sandboxed
                              ? 'border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                              : 'border-amber-600/30 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>{sandboxed ? 'Isolated' : 'Direct'}</span>
                        </button>
                      </td>
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setRunningApp(app)}
                          className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            isTouch ? 'min-h-[40px]' : 'min-h-[30px]'
                          }`}
                        >
                          <Play className="w-3 h-3" aria-hidden="true" />
                          <span>Launch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Side: Syscall Translation Inspector + Real Local Binary Header Analyzer */}
        <div className="xl:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Syscall &amp; API Mapping · {selectedApp.origin.toUpperCase()}
                </div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedApp.name}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {selectedApp.ramMb} MB cap
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApp.summary}</p>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800">
              {selectedApp.syscallTranslation.map((row) => (
                <div key={row.sourceApi} className="py-3 space-y-1">
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Source: {row.sourceApi}
                  </div>
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                    Bridge: {row.moringaLayer}
                  </div>
                  <div className="text-xs font-mono text-slate-800 dark:text-slate-200">
                    Kernel: {row.targetKernel}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRunningApp(selectedApp)}
                className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
              >
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Simulate Runtime Launch</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onLaunchInSandbox(
                    `console.log("Launching ${selectedApp.name} (${selectedApp.binaryFormat})");\nconsole.log("Bridge: ${selectedApp.bridgeEngine}");\nconsole.log("Sandbox Policy: ${
                      sandboxPolicies[selectedApp.id] ? 'Seccomp-BPF + Ephemeral Prefix' : 'Host Direct'
                    }");\nconsole.log("Memory Allocation: ${selectedApp.ramMb} MB cgroup limit enforced.");`,
                    selectedApp.name
                  )
                }
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verify in Sandbox</span>
              </button>
            </div>
          </div>

          {/* Local Binary Magic-Byte Inspector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Inspect Local Executable or File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reads the first 64 magic header bytes locally in memory to identify ELF, PE (.exe),
                  Mach-O, or WASM compatibility.
                </p>
              </div>
              <FileCode2 className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInspect}
              className="hidden"
              aria-label="Select local binary file to inspect"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors px-4 ${
                isTouch ? 'min-h-[48px]' : 'min-h-[42px]'
              }`}
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Select .exe, .AppImage, Mach-O, or Script</span>
            </button>

            {inspection && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {inspection.fileName}
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums shrink-0">
                    {inspection.sizeBytes.toLocaleString()} bytes
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                  Magic Bytes: {inspection.hexPreview}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Detected: {inspection.detectedPlatform}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Moringa Bridge: {inspection.recommendedBridge}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulated App Runtime Modal Window */}
      {runningApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${runningApp.name} Runtime Window`}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-display font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {runningApp.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {runningApp.bridgeEngine}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRunningApp(null)}
                aria-label="Close application window"
                className={`inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isTouch ? 'min-h-[44px] min-w-[44px]' : 'h-8 w-8'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs bg-slate-950 text-slate-200">
              <div className="text-emerald-400">
                [moringa-launcher] Initializing {runningApp.origin.toUpperCase()} compatibility
                container...
              </div>
              <div>
                [bridge] Runtime: {runningApp.bridgeEngine} ({runningApp.binaryFormat})
              </div>
              <div>
                [containment] Isolation:{' '}
                {sandboxPolicies[runningApp.id]
                  ? 'Bubblewrap UserNS + Seccomp-BPF + Ephemeral Prefix'
                  : 'Direct Wayland Session'}
              </div>
              <div>
                [gpu] Surface bound:{' '}
                {runningApp.gpuAccelerated
                  ? 'Vulkan DMA-BUF compositor pass-through active'
                  : 'CPU Wayland shm buffer'}
              </div>
              <div>
                [cgroup] Memory quota: {runningApp.ramMb} MB · PID namespace isolated
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400">
                Session healthy. All cross-platform syscalls mapped cleanly with zero host rootfs
                writes.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setRunningApp(null)}
                className={`rounded-lg bg-slate-900 dark:bg-slate-800 text-white px-4 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors ${controlHeight}`}
              >
                Terminate Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

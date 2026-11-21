import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  HardDrive,
  Play,
  RotateCcw,
  Usb,
} from 'lucide-react';
import {
  ASSET_PATHS,
  generateUsbBuilderScript,
} from '../data/osCatalog';
import {
  InputMode,
  UsbBuildConfig,
} from '../types/os';

interface UsbBuilderProps {
  inputMode: InputMode;
}

const BOOT_ENTRIES = [
  {
    id: 'live',
    title: 'Moringa OS Live (Workstation · RAM Overlay)',
    kernelLine: 'linux /live/vmlinuz boot=live quiet splash moringa.sandbox=strict',
  },
  {
    id: 'persistent',
    title: 'Moringa OS Persistent (LUKS2 Encrypted Home)',
    kernelLine: 'linux /live/vmlinuz boot=live persistence persistence-encryption=luks',
  },
  {
    id: 'safe',
    title: 'Moringa OS Hardware Diagnostic & Safe Graphics',
    kernelLine: 'linux /live/vmlinuz boot=live nomodeset moringa.probe=verbose',
  },
];

export const UsbBuilder: React.FC<UsbBuilderProps> = ({ inputMode }) => {
  const [config, setConfig] = useState<UsbBuildConfig>({
    arch: 'x86_64',
    edition: 'workstation',
    persistenceGb: 32,
    filesystem: 'btrfs',
    driveInterface: 'usbc-nvme',
  });
  const [copied, setCopied] = useState(false);
  const [usbImageError, setUsbImageError] = useState(false);
  const [selectedBootIdx, setSelectedBootIdx] = useState(0);
  const [bootStage, setBootStage] = useState<'menu' | 'booting' | 'ready'>('menu');
  const [bootLines, setBootLines] = useState<string[]>([]);

  const isTouch = inputMode === 'touch';
  const controlHeight = isTouch ? 'min-h-[44px]' : 'min-h-[36px]';

  const generatedScript = useMemo(() => generateUsbBuilderScript(config), [config]);

  const bootManifest = useMemo(() => {
    const baseImageMb =
      config.edition === 'workstation' ? 2840 : config.edition === 'security' ? 2120 : 1480;
    return {
      os: 'Moringa OS',
      version: '1.0 LTS',
      developer: 'Wrld Xavier',
      vendor: 'Wrld Tech',
      architecture: config.arch,
      edition: config.edition,
      bootModes: ['UEFI Secure Boot', 'Legacy MBR/BIOS Fallback'],
      partitionTable: 'GPT Hybrid',
      partitions: [
        { label: 'MORINGA_EFI', fs: 'FAT32', sizeMb: 512, flags: 'boot,esp' },
        { label: 'MORINGA_LIVE', fs: 'SquashFS (zstd)', sizeMb: baseImageMb, flags: 'read-only' },
        ...(config.persistenceGb > 0
          ? [
              {
                label: 'MORINGA_PERSIST',
                fs: `LUKS2 (${config.filesystem})`,
                sizeMb: config.persistenceGb * 1024,
                flags: 'encrypted-home',
              },
            ]
          : []),
      ],
      compatibilityEngines: ['Linux ELF64 Native', 'WinBridge (Wine + DXVK)', 'DarwinBridge (Darling)'],
      sandboxEngine: 'Bubblewrap + Seccomp-BPF',
    };
  }, [config]);

  useEffect(() => {
    if (bootStage !== 'booting') return;
    const entry = BOOT_ENTRIES[selectedBootIdx];
    const sequence = [
      `[UEFI] Verified Moringa OS signed shim (${config.arch})`,
      `[GRUB] ${entry.kernelLine}`,
      `[initramfs] Mounting immutable SquashFS image from ${config.driveInterface}...`,
      config.persistenceGb > 0
        ? `[cryptsetup] Unlocking ${config.persistenceGb} GB LUKS2 ${config.filesystem} persistence volume...`
        : `[overlayfs] Creating volatile tmpfs upper layer (amnesic mode)...`,
      `[udev] Hardware probe: GPU DRM/KMS + Wi-Fi + Touch digitizer + USB4 bound`,
      `[sandbox] Loading Seccomp-BPF profile and WinBridge / DarwinBridge namespaces`,
      `[wayland] Moringa Desktop Shell active. Ready for touch & keyboard input.`,
    ];

    setBootLines([]);
    const timers: number[] = [];
    sequence.forEach((line, index) => {
      const t = window.setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
        if (index === sequence.length - 1) {
          setBootStage('ready');
        }
      }, (index + 1) * 320);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [bootStage, selectedBootIdx, config]);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const downloadTextFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Bootable USB Creator &amp; Live Boot Simulator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure a hybrid UEFI/BIOS Moringa OS USB image with optional encrypted persistence,
            export the reproducible builder script, and test the live boot handoff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadTextFile('moringa-usb-custom.sh', generatedScript)}
            className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Builder (.sh)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                'moringa-boot-manifest.json',
                JSON.stringify(bootManifest, null, 2),
                'application/json'
              )
            }
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Partition Manifest</span>
          </button>
        </div>
      </div>

      {/* Top Split: Hardware Preview + Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] overflow-hidden flex flex-col">
          <div className="relative h-56 sm:h-64 bg-slate-900">
            {!usbImageError ? (
              <img
                src={ASSET_PATHS.usbHardware}
                alt="Anodized titanium USB-C Moringa OS bootable drive on workstation desk"
                referrerPolicy="no-referrer"
                onError={() => setUsbImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300">
                <Usb className="w-10 h-10 mb-2 text-emerald-500" />
                <span className="text-sm font-medium">Moringa OS Bootable USB-C</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="text-xs text-slate-300">
                Hybrid GPT · UEFI Secure Boot + BIOS Fallback
              </div>
              <div className="font-display text-lg font-semibold mt-0.5">
                moringa-os-1.0-{config.edition}-{config.arch}.iso
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Planned USB Partition Layout
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800 text-xs">
                {bootManifest.partitions.map((part) => (
                  <div key={part.label} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {part.label}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">{part.fs}</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {part.sizeMb >= 1024
                        ? `${(part.sizeMb / 1024).toFixed(1)} GB`
                        : `${part.sizeMb} MB`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Matrix */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Target CPU Architecture
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['x86_64', 'arm64'] as const).map((arch) => (
                  <button
                    key={arch}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, arch }))}
                    className={`rounded-lg border text-xs font-mono font-medium transition-colors px-3 ${controlHeight} ${
                      config.arch === arch
                        ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {arch}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                OS Edition
              </label>
              <select
                value={config.edition}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    edition: e.target.value as UsbBuildConfig['edition'],
                  }))
                }
                className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
              >
                <option value="workstation">Workstation Full (Linux + Win + macOS Bridges)</option>
                <option value="core">Core Portable (Lightweight Wayland + Sandbox)</option>
                <option value="security">Security Live (Hardened Kernel + Forensic Tools)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Encrypted Persistence (LUKS2)
              </label>
              <select
                value={config.persistenceGb}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    persistenceGb: Number(e.target.value) as UsbBuildConfig['persistenceGb'],
                  }))
                }
                className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
              >
                <option value={0}>None (Amnesic RAM-Only Boot)</option>
                <option value={16}>16 GB Encrypted Persistence</option>
                <option value={32}>32 GB Encrypted Persistence</option>
                <option value={64}>64 GB Encrypted Persistence</option>
                <option value={128}>128 GB Encrypted Persistence</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Persistence Filesystem &amp; USB Bus
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={config.filesystem}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      filesystem: e.target.value as UsbBuildConfig['filesystem'],
                    }))
                  }
                  className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
                >
                  <option value="btrfs">Btrfs (Zstd)</option>
                  <option value="ext4">ext4 Journaled</option>
                </select>
                <select
                  value={config.driveInterface}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      driveInterface: e.target.value as UsbBuildConfig['driveInterface'],
                    }))
                  }
                  className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
                >
                  <option value="usbc-nvme">USB-C NVMe</option>
                  <option value="usb32-flash">USB 3.2 Flash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generated Builder Command Preview */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
              <span className="font-mono text-xs text-slate-300">moringa-usb-custom.sh</span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              {generatedScript}
            </pre>
          </div>
        </div>
      </div>

      {/* Interactive UEFI / Live USB Boot Sequence Simulator */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Live USB Boot Sequence Simulator (UEFI GRUB)
            </h2>
            <p className="text-xs text-slate-400">
              Select a boot target below and simulate the initramfs to Wayland desktop handoff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {bootStage !== 'menu' && (
              <button
                type="button"
                onClick={() => {
                  setBootStage('menu');
                  setBootLines([]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors ${controlHeight}`}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reboot to Menu</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setBootStage('booting')}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-medium text-white transition-colors ${controlHeight}`}
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Boot Selected Entry</span>
            </button>
          </div>
        </div>

        <div className="p-6 font-mono text-xs space-y-4">
          {bootStage === 'menu' ? (
            <div className="space-y-2">
              <div className="text-slate-400 mb-3">
                GNU GRUB version 2.12 — Moringa OS Bootable USB ({config.arch})
              </div>
              {BOOT_ENTRIES.map((entry, idx) => {
                const selected = idx === selectedBootIdx;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedBootIdx(idx)}
                    className={`w-full text-left px-4 rounded-lg border transition-colors flex items-center justify-between gap-4 ${
                      isTouch ? 'min-h-[48px]' : 'min-h-[38px]'
                    } ${
                      selected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>
                      {selected ? '* ' : '  '}
                      {entry.title}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {selected ? 'Selected' : 'Tap / Click'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5 min-h-[170px]">
              {bootLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    i === bootLines.length - 1 && bootStage === 'ready'
                      ? 'text-emerald-400 font-medium'
                      : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))}
              {bootStage === 'booting' && (
                <div className="text-slate-500 pt-1">Initializing kernel modules...</div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  Box,
  CheckCircle2,
  Cpu,
  Download,
  HardDrive,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  Square,
  Terminal as TerminalIcon,
  Trash2,
} from 'lucide-react';
import {
  ACADEMIC_TRACKS,
  DEVICE_PROFILES,
  INITIAL_CONTAINERS,
  INITIAL_HARDENING_CONTROLS,
  INITIAL_K8S_PODS,
  INITIAL_PROCESSES,
} from '../data/osCatalog';
import {
  AcademicTrackId,
  ContainerInstance,
  DeviceProfileId,
  HardeningControl,
  InputMode,
  KubernetesPod,
  OsProcess,
} from '../types/os';

interface SystemMonitorProps {
  deviceProfile: DeviceProfileId;
  inputMode: InputMode;
  onOpenTerminalCommand: (cmd: string) => void;
  onLaunchInSandbox: (code: string, label: string) => void;
}

type MonitorTab = 'resources' | 'containers' | 'hardening' | 'installer';
type WorkloadPreset = 'baseline' | 'ctf' | 'k8s' | 'datascience';

interface TelemetryPoint {
  tick: string;
  cpuTotal: number;
  cpuUser: number;
  cpuKernel: number;
  memActiveGb: number;
  memCacheGb: number;
  swapGb: number;
  diskReadMb: number;
  diskWriteMb: number;
}

const PRESET_PROFILES: Record<
  WorkloadPreset,
  { label: string; cpuBase: number; memRatio: number; diskBase: number }
> = {
  baseline: { label: 'Idle Workstation', cpuBase: 14, memRatio: 0.24, diskBase: 45 },
  ctf: { label: 'THM / HTB Recon & Burp', cpuBase: 42, memRatio: 0.46, diskBase: 190 },
  k8s: { label: 'K8s & Docker Build', cpuBase: 68, memRatio: 0.64, diskBase: 540 },
  datascience: { label: 'PyTorch / DuckDB Compute', cpuBase: 82, memRatio: 0.78, diskBase: 760 },
};

function createSamplePoint(
  seq: number,
  preset: WorkloadPreset,
  totalMemGb: number,
  maxDiskMb: number
): TelemetryPoint {
  const cfg = PRESET_PROFILES[preset];
  const wave = Math.sin(seq * 0.55) * 6 + Math.cos(seq * 0.3) * 4;
  const cpuTotal = Math.min(98, Math.max(4, Math.round((cfg.cpuBase + wave) * 10) / 10));
  const cpuKernel = Math.round(cpuTotal * 0.22 * 10) / 10;
  const cpuUser = Math.round((cpuTotal - cpuKernel) * 10) / 10;

  const memActiveGb = Math.min(
    totalMemGb * 0.92,
    Math.round((totalMemGb * cfg.memRatio + Math.sin(seq * 0.35) * 1.1) * 10) / 10
  );
  const memCacheGb = Math.round(totalMemGb * 0.14 * 10) / 10;
  const swapGb = preset === 'datascience' || preset === 'k8s' ? 1.4 : 0.3;

  const diskReadMb = Math.min(
    maxDiskMb,
    Math.max(8, Math.round(cfg.diskBase + Math.sin(seq * 0.7) * (cfg.diskBase * 0.28)))
  );
  const diskWriteMb = Math.min(
    maxDiskMb,
    Math.max(4, Math.round(cfg.diskBase * 0.58 + Math.cos(seq * 0.6) * (cfg.diskBase * 0.2)))
  );

  const now = new Date();
  const tick = now.toLocaleTimeString('en-US', {
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    tick,
    cpuTotal,
    cpuUser,
    cpuKernel,
    memActiveGb,
    memCacheGb,
    swapGb,
    diskReadMb,
    diskWriteMb,
  };
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  deviceProfile,
  inputMode,
  onOpenTerminalCommand,
  onLaunchInSandbox,
}) => {
  const profile = DEVICE_PROFILES[deviceProfile];
  const isTouch = inputMode === 'touch';
  const controlHeight = isTouch ? 'min-h-[44px]' : 'min-h-[36px]';

  const [activeTab, setActiveTab] = useState<MonitorTab>('resources');
  const [preset, setPreset] = useState<WorkloadPreset>('ctf');
  const [intervalMs, setIntervalMs] = useState<number>(1500);
  const [paused, setPaused] = useState(false);

  const [series, setSeries] = useState<TelemetryPoint[]>(() =>
    Array.from({ length: 24 }, (_, idx) =>
      createSamplePoint(idx + 1, 'ctf', profile.memoryTotalGb, profile.diskMaxMbPerSec)
    )
  );
  const [tickCount, setTickCount] = useState(25);

  const [processes, setProcesses] = useState<OsProcess[]>(INITIAL_PROCESSES);
  const [processSearch, setProcessSearch] = useState('');

  const [containers, setContainers] = useState<ContainerInstance[]>(INITIAL_CONTAINERS);
  const [pods, setPods] = useState<KubernetesPod[]>(INITIAL_K8S_PODS);
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerImage, setNewContainerImage] = useState('alpine:3.20');

  const [hardening, setHardening] = useState<HardeningControl[]>(INITIAL_HARDENING_CONTROLS);
  const [selectedTrackId, setSelectedTrackId] = useState<AcademicTrackId>('cybersecurity');
  const [ctfVpnActive, setCtfVpnActive] = useState(true);
  const [ctfPlatform, setCtfPlatform] = useState<'tryhackme' | 'hackthebox'>('tryhackme');

  const [installDiskFs, setInstallDiskFs] = useState<'btrfs-luks2' | 'ext4-luks2'>('btrfs-luks2');
  const [installDone, setInstallDone] = useState(false);

  useEffect(() => {
    setSeries(
      Array.from({ length: 24 }, (_, idx) =>
        createSamplePoint(idx + 1, preset, profile.memoryTotalGb, profile.diskMaxMbPerSec)
      )
    );
  }, [preset, profile.memoryTotalGb, profile.diskMaxMbPerSec]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setTickCount((c) => {
        const next = c + 1;
        setSeries((prev) => [
          ...prev.slice(-29),
          createSamplePoint(next, preset, profile.memoryTotalGb, profile.diskMaxMbPerSec),
        ]);
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, intervalMs, preset, profile.memoryTotalGb, profile.diskMaxMbPerSec]);

  const latest = series[series.length - 1];
  const selectedTrack = ACADEMIC_TRACKS.find((t) => t.id === selectedTrackId) ?? ACADEMIC_TRACKS[0];

  const filteredProcesses = useMemo(() => {
    const q = processSearch.trim().toLowerCase();
    if (!q) return processes;
    return processes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subsystem.toLowerCase().includes(q) ||
        String(p.pid).includes(q)
    );
  }, [processes, processSearch]);

  const handleToggleProcessIsolation = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) =>
        p.pid === pid
          ? { ...p, state: p.state === 'isolated' ? 'running' : 'isolated' }
          : p
      )
    );
  };

  const handleTerminateProcess = (pid: number) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
  };

  const handleToggleContainer = (id: string) => {
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextRunning = c.status === 'stopped';
        return {
          ...c,
          status: nextRunning ? 'running' : 'stopped',
          cpuPercent: nextRunning ? 2.4 : 0,
          memoryMb: nextRunning ? 384 : 0,
        };
      })
    );
  };

  const handleDeployContainer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newContainerName.trim();
    if (!cleanName) return;
    const id = Math.random().toString(16).slice(2, 12);
    setContainers((prev) => [
      {
        id,
        name: cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        image: newContainerImage.trim() || 'alpine:3.20',
        runtime: 'docker',
        status: 'running',
        ports: '127.0.0.1:8080->80/tcp',
        cpuPercent: 1.8,
        memoryMb: 256,
        track: selectedTrack.title,
      },
      ...prev,
    ]);
    setNewContainerName('');
  };

  const handleScalePod = (name: string, delta: number) => {
    setPods((prev) =>
      prev.map((pod) => {
        if (pod.name !== name) return pod;
        const replicas = Math.max(0, Math.min(8, pod.replicas + delta));
        return {
          ...pod,
          replicas,
          status: replicas === 0 ? 'Scaled Down' : 'Running',
        };
      })
    );
  };

  const handleRestartPod = (name: string) => {
    setPods((prev) =>
      prev.map((pod) => (pod.name === name ? { ...pod, status: 'Restarting' } : pod))
    );
    window.setTimeout(() => {
      setPods((prev) =>
        prev.map((pod) =>
          pod.name === name ? { ...pod, status: pod.replicas > 0 ? 'Running' : 'Scaled Down' } : pod
        )
      );
    }, 600);
  };

  const handleToggleHardening = (id: string) => {
    setHardening((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const downloadHardeningConfig = () => {
    const lines = [
      '# /etc/sysctl.d/99-moringa-hardening.conf',
      '# Generated by Moringa OS System Monitor (Wrld Xavier · Wrld Tech)',
      ...hardening.map((h) => `${h.enabled ? '' : '# '}${h.parameter} # ${h.title}`),
    ];
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '99-moringa-hardening.conf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInstallerManifest = () => {
    const script = `#!/usr/bin/env bash
# Moringa OS Bare-Metal Installer Profile (Wrld Xavier · Wrld Tech)
# Target Hardware: ${profile.label} (${profile.cpuCores} Threads · ${profile.memoryCeiling})
set -euo pipefail

DISK="/dev/nvme0n1"
FILESYSTEM_SCHEME="${installDiskFs}"
TRACK="${selectedTrack.id}"

echo "[1/3] Verifying UEFI 2.3+ & TPM 2.0 readiness..."
test -d /sys/firmware/efi || { echo "UEFI required"; exit 1; }
echo "[2/3] Partitioning \${DISK} with GPT (512M EFI + Immutable Btrfs Root + LUKS2 /home)..."
echo "[3/3] Provisioning institutional track: \${TRACK} (Docker + K3s + Seccomp-BPF)"
`;
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moringa-baremetal-install.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  const enabledHardeningCount = hardening.filter((h) => h.enabled).length;

  return (
    <div className="space-y-8">
      {/* Header & Sampling Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Host: moringa-workstation</span>
            <span aria-hidden="true">·</span>
            <span>Kernel 6.12 LTS</span>
            <span aria-hidden="true">·</span>
            <span>
              {profile.label} ({profile.cpuCores} vCPU · {profile.memoryCeiling})
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            System Monitor &amp; Operations Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Workload simulation preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value as WorkloadPreset)}
            className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 ${controlHeight}`}
          >
            {Object.entries(PRESET_PROFILES).map(([key, val]) => (
              <option key={key} value={key}>
                Load: {val.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Telemetry sampling interval"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-mono text-slate-800 dark:text-slate-200 ${controlHeight}`}
          >
            <option value={1000}>1.0s poll</option>
            <option value={1500}>1.5s poll</option>
            <option value={3000}>3.0s poll</option>
          </select>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            {paused ? (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>CPU Utilization</span>
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {latest.cpuTotal.toFixed(1)}%
          </div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            User {latest.cpuUser.toFixed(1)}% · Kernel {latest.cpuKernel.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Memory Footprint</span>
            <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {latest.memActiveGb.toFixed(1)} / {profile.memoryTotalGb} GB
          </div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Cache {latest.memCacheGb.toFixed(1)} GB · ZRAM {latest.swapGb.toFixed(1)} GB
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>NVMe Disk Throughput</span>
            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {latest.diskReadMb} MB/s
          </div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Write {latest.diskWriteMb} MB/s · LUKS2 Btrfs
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Hardening &amp; Containers</span>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {enabledHardeningCount}/{hardening.length} Policies
          </div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {containers.filter((c) => c.status === 'running').length} Containers ·{' '}
            {pods.filter((p) => p.status === 'Running').length} K8s Pods
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit max-w-full overflow-x-auto">
        {(
          [
            { id: 'resources', label: 'Resources & Processes' },
            { id: 'containers', label: 'Docker & Kubernetes' },
            { id: 'hardening', label: 'Hardening & CTF Labs' },
            { id: 'installer', label: 'Device Installer' },
          ] as Array<{ id: MonitorTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 px-3.5 ${
              isTouch ? 'min-h-[44px]' : 'min-h-[34px]'
            } ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Real-Time Recharts CPU, Memory, Disk + Process Table */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CPU Chart */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    CPU Load History
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    User vs Kernel (%) · {profile.cpuCores} Threads
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {latest.cpuTotal.toFixed(1)}%
                </span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuUserGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="cpuKernelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.22} />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      minTickGap={28}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cpuUser"
                      name="User %"
                      stroke="#16a34a"
                      strokeWidth={2}
                      fill="url(#cpuUserGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="cpuKernel"
                      name="Kernel %"
                      stroke="#f59e0b"
                      strokeWidth={1.75}
                      fill="url(#cpuKernelGrad)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Memory Chart */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Memory &amp; Page Cache
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active RSS vs Cache (GB) · {profile.memoryTotalGb} GB Total
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                  {latest.memActiveGb.toFixed(1)} GB
                </span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="memActiveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.22} />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      minTickGap={28}
                    />
                    <YAxis
                      domain={[0, profile.memoryTotalGb]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="memActiveGb"
                      name="Active RSS (GB)"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fill="url(#memActiveGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="memCacheGb"
                      name="Page Cache (GB)"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      fill="transparent"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disk I/O Chart */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Disk I/O Throughput
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    NVMe Read / Write (MB/s)
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {latest.diskReadMb + latest.diskWriteMb} MB/s
                </span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="diskReadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.22} />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      minTickGap={28}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="diskReadMb"
                      name="Read (MB/s)"
                      stroke="#d97706"
                      strokeWidth={2}
                      fill="url(#diskReadGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="diskWriteMb"
                      name="Write (MB/s)"
                      stroke="#10b981"
                      strokeWidth={1.75}
                      fill="transparent"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Mounted Filesystems Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { mount: '/ (Immutable Root)', fs: 'SquashFS + OverlayFS', used: '14.2 / 32 GB', pct: 44 },
              { mount: '/home (Encrypted)', fs: 'Btrfs · LUKS2 AES-XTS', used: '68.4 / 256 GB', pct: 27 },
              { mount: '/var/lib/containerd', fs: 'Btrfs Subvolume', used: '41.8 / 128 GB', pct: 33 },
              { mount: '/tmp (Ephemeral Sandbox)', fs: 'RAM tmpfs', used: '1.2 / 16 GB', pct: 8 },
            ].map((vol) => (
              <div
                key={vol.mount}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-slate-900 dark:text-white truncate">
                    {vol.mount}
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums shrink-0">{vol.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${vol.pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{vol.fs}</span>
                  <span className="font-mono tabular-nums">{vol.used}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Process Manager Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Active System Processes
              </h2>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={processSearch}
                  onChange={(e) => setProcessSearch(e.target.value)}
                  placeholder="Filter PID, process, or subsystem..."
                  aria-label="Filter active processes"
                  className={`pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${controlHeight}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">PID</th>
                    <th className="py-3 px-4">Process</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Subsystem</th>
                    <th className="py-3 px-4 text-right">CPU %</th>
                    <th className="py-3 px-4 text-right">RSS Memory</th>
                    <th className="py-3 px-4">Containment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                  {filteredProcesses.map((proc) => (
                    <tr
                      key={proc.pid}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        {proc.pid}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        {proc.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {proc.user}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {proc.subsystem}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-slate-900 dark:text-slate-100 tabular-nums">
                        {proc.cpuPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-slate-700 dark:text-slate-300 tabular-nums">
                        {proc.memoryMb} MB
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            proc.state === 'isolated'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>{proc.state === 'isolated' ? 'Sandboxed' : 'Host Namespace'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProcessIsolation(proc.pid)}
                            className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            {proc.state === 'isolated' ? 'Unisolate' : 'Sandbox'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTerminateProcess(proc.pid)}
                            aria-label={`Terminate ${proc.name}`}
                            className="rounded border border-red-500/30 px-2 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 whitespace-nowrap"
                          >
                            SIGTERM
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Docker / Podman & Kubernetes Cluster */}
      {activeTab === 'containers' && (
        <div className="space-y-8">
          {/* Quick Container Deployment Form */}
          <form
            onSubmit={handleDeployContainer}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-5 flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  New Container Name
                </label>
                <input
                  type="text"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  placeholder="e.g. htb-pivot-box"
                  className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white ${controlHeight}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  OCI Image Reference
                </label>
                <input
                  type="text"
                  value={newContainerImage}
                  onChange={(e) => setNewContainerImage(e.target.value)}
                  placeholder="e.g. wrldtech/moringa-sec-lab:2026.1"
                  className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 font-mono text-xs text-slate-900 dark:text-white ${controlHeight}`}
                />
              </div>
            </div>
            <button
              type="submit"
              className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Deploy Isolated Container</span>
            </button>
          </form>

          {/* Docker / Podman Containers Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Docker &amp; Rootless Podman Runtimes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isolated lab containers for CTF challenges, CI builds, and analytics pipelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenTerminalCommand('docker ps')}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                Inspect via CLI (docker ps)
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Container</th>
                    <th className="py-3 px-4">Image &amp; Runtime</th>
                    <th className="py-3 px-4">Academic Track</th>
                    <th className="py-3 px-4">Ports</th>
                    <th className="py-3 px-4 text-right">CPU / Mem</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                  {containers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-medium text-slate-900 dark:text-white">
                          {c.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">{c.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{c.image}</div>
                        <div className="text-[11px] text-slate-500 uppercase">{c.runtime}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{c.track}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {c.ports}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {c.cpuPercent.toFixed(1)}% · {c.memoryMb} MB
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            c.status === 'running'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Box className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{c.status === 'running' ? 'Running' : 'Stopped'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleContainer(c.id)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            {c.status === 'running' ? (
                              <>
                                <Square className="w-3 h-3" aria-hidden="true" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" aria-hidden="true" />
                                <span>Start</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTerminalCommand(`docker exec -it ${c.name} /bin/sh`)}
                            className="inline-flex items-center gap-1 rounded border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 whitespace-nowrap"
                          >
                            <TerminalIcon className="w-3 h-3" aria-hidden="true" />
                            <span>Shell</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Local Kubernetes (K3s) Cluster Pods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Kubernetes Local Cluster (K3s Control Plane)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nodes: moringa-control-plane (Ready) · moringa-worker-01 (Ready) · CNI: Flannel +
                  Cilium NetworkPolicy
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenTerminalCommand('kubectl get pods')}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                kubectl get pods
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Pod &amp; Purpose</th>
                    <th className="py-3 px-4">Namespace</th>
                    <th className="py-3 px-4">Node</th>
                    <th className="py-3 px-4 text-right">Requests</th>
                    <th className="py-3 px-4">Replicas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Orchestration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                  {pods.map((pod) => (
                    <tr
                      key={pod.name}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-medium text-slate-900 dark:text-white">
                          {pod.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{pod.purpose}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {pod.namespace}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {pod.node}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {pod.cpuMillicores}m · {pod.memoryMb} MB
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2 font-mono tabular-nums">
                          <button
                            type="button"
                            onClick={() => handleScalePod(pod.name, -1)}
                            aria-label={`Scale down ${pod.name}`}
                            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            -
                          </button>
                          <span className="w-4 text-center">{pod.replicas}</span>
                          <button
                            type="button"
                            onClick={() => handleScalePod(pod.name, 1)}
                            aria-label={`Scale up ${pod.name}`}
                            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-medium ${
                            pod.status === 'Running'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : pod.status === 'Restarting'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {pod.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestartPod(pod.name)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          <RefreshCw className="w-3 h-3" aria-hidden="true" />
                          <span>Rollout Restart</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: System Hardening & Tech Institution CTF Tracks */}
      {activeTab === 'hardening' && (
        <div className="space-y-8">
          {/* Tech Institution Academic Specializations */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Tech Institution Specialization Profiles
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tailored OS toolchains, CTF VPN isolation, and container stacks for students
                  across every engineering and security track.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {ACADEMIC_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`rounded-md text-xs font-medium px-3 whitespace-nowrap shrink-0 transition-colors ${
                      isTouch ? 'min-h-[44px]' : 'min-h-[32px]'
                    } ${
                      selectedTrackId === track.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {track.id === 'cybersecurity'
                      ? 'Cybersecurity & CTF'
                      : track.id === 'software'
                      ? 'Software Eng'
                      : 'Data Science'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {selectedTrack.certifications}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedTrack.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {selectedTrack.summary}
                  </p>
                </div>

                <div className="text-xs space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Isolation Boundary: </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {selectedTrack.ctfAndLabReady}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Kernel Policy: </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {selectedTrack.kernelCapabilities}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onLaunchInSandbox(
                        `console.log("Provisioned institutional track: ${selectedTrack.title}");\nconsole.log("Certifications aligned: ${selectedTrack.certifications}");\nconsole.log("Prebuilt tools: ${selectedTrack.prebuiltTools.join(', ')}");\nconsole.log("Sandbox isolation verified for lab execution.");`,
                        selectedTrack.title
                      )
                    }
                    className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
                  >
                    <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Test Track in Virtual Sandbox</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenTerminalCommand(`ctf-vpn status`)}
                    className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inspect CTF Tunnel in Shell</span>
                  </button>
                </div>
              </div>

              {/* CTF Network Isolation + Prebuilt Tools */}
              <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-5 lg:pt-0 lg:pl-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      CTF Range Tunnel (tun0 Namespace)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCtfVpnActive((v) => !v)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                        ctfVpnActive
                          ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {ctfVpnActive ? 'tun0 Active (10.10.14.8)' : 'Tunnel Off'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['tryhackme', 'hackthebox'] as const).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setCtfPlatform(plat)}
                        className={`rounded-lg border text-xs font-medium px-3 transition-colors ${controlHeight} ${
                          ctfPlatform === plat
                            ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {plat === 'tryhackme' ? 'TryHackMe (THM)' : 'Hack The Box (HTB)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Included Track Toolset
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {selectedTrack.prebuiltTools.map((tool) => (
                      <div key={tool} className="truncate">
                        · {tool}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Kernel & OS System Hardening Matrix */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Kernel &amp; OS Hardening Policy Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforce sysctl kernel protections, AppArmor/Seccomp, nftables firewall rules, and
                  LUKS2 TPM 2.0 sealing.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadHardeningConfig}
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export sysctl Hardening (.conf)</span>
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922]">
              {hardening.map((ctrl) => (
                <div
                  key={ctrl.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-slate-900 dark:text-white">
                        {ctrl.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        · {ctrl.standard}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{ctrl.description}</p>
                    <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      {ctrl.parameter}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleHardening(ctrl.id)}
                    className={`rounded-lg border px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight} ${
                      ctrl.enabled
                        ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ctrl.enabled ? 'Enforced' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: Modern Device Bare-Metal Installer */}
      {activeTab === 'installer' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Modern Compatible Device Installer ({profile.label})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Install Moringa OS directly onto internal NVMe/SSD storage alongside or in place
                  of Windows, macOS, or Linux with full UEFI Secure Boot and TPM 2.0 support.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadInstallerManifest}
                className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download Bare-Metal Installer (.sh)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                { check: 'Firmware Mode', detail: 'UEFI 2.3+ Secure Boot Ready' },
                { check: 'Hardware Virtualization', detail: 'Intel VT-x / AMD-V + KVM Enabled' },
                { check: 'Root of Trust', detail: 'TPM 2.0 PCR Sealing Detected' },
                { check: 'Storage Controller', detail: 'NVMe PCIe 4.0 / AHCI Compatible' },
                { check: 'Graphics Stack', detail: 'Vulkan 1.3 + Wayland DRM/KMS' },
                { check: 'Input Subsystems', detail: 'HID Keyboard + 10-Point Touch' },
              ].map((item) => (
                <div
                  key={item.check}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{item.check}</div>
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">{item.detail}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Pass</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Target Filesystem Scheme:
                </span>
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInstallDiskFs('btrfs-luks2')}
                    className={`rounded-md text-xs font-medium px-3 ${
                      isTouch ? 'min-h-[40px]' : 'min-h-[30px]'
                    } ${
                      installDiskFs === 'btrfs-luks2'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Btrfs + LUKS2 Snapshots
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallDiskFs('ext4-luks2')}
                    className={`rounded-md text-xs font-medium px-3 ${
                      isTouch ? 'min-h-[40px]' : 'min-h-[30px]'
                    } ${
                      installDiskFs === 'ext4-luks2'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    ext4 + LUKS2
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInstallDone(true)}
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 text-xs font-medium text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
              >
                <Server className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {installDone
                    ? 'Install Plan Staged (/dev/nvme0n1)'
                    : 'Stage Bare-Metal Install Plan'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

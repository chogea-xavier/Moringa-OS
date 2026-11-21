import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { SANDBOX_PRESETS } from '../data/osCatalog';
import {
  InputMode,
  SandboxPolicy,
} from '../types/os';

interface SandboxStudioProps {
  inputMode: InputMode;
  injectedPayload?: { code: string; label: string } | null;
}

interface SandboxLogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export const SandboxStudio: React.FC<SandboxStudioProps> = ({
  inputMode,
  injectedPayload,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState(SANDBOX_PRESETS[0].id);
  const [code, setCode] = useState(SANDBOX_PRESETS[0].code);
  const [policy, setPolicy] = useState<SandboxPolicy>({
    network: 'blocked',
    filesystem: 'ephemeral-tmpfs',
    seccomp: 'strict',
    memoryMb: 1024,
    cpuPercent: 50,
  });
  const [runCounter, setRunCounter] = useState(1);
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [sandboxStatus, setSandboxStatus] = useState<'ready' | 'running' | 'wiped'>('ready');

  const isTouch = inputMode === 'touch';
  const controlHeight = isTouch ? 'min-h-[44px]' : 'min-h-[36px]';

  useEffect(() => {
    if (injectedPayload) {
      setCode(injectedPayload.code);
      setSandboxStatus('ready');
    }
  }, [injectedPayload]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'moringa-sandbox-frame') return;
      const now = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: Date.now() + Math.random(),
          timestamp: now,
          level: event.data.level || 'info',
          message: String(event.data.message),
        },
      ]);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const srcDoc = useMemo(() => {
    const cspConnect =
      policy.network === 'blocked' ? "connect-src 'none';" : "connect-src http://localhost:* http://127.0.0.1:*;";
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; ${cspConnect}" />
  <style>
    body { margin: 12px; background: #091116; color: #e2e8f0; font-family: ui-monospace, monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div id="sandbox-root" style="color:#94a3b8;font-size:12px;">Ephemeral Moringa Sandbox Container #${runCounter} initialized (${policy.seccomp} seccomp · ${policy.network} network).</div>
  <script>
    (function() {
      const emit = (level, args) => {
        const text = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        parent.postMessage({ source: 'moringa-sandbox-frame', level, message: text }, '*');
      };
      console.log = (...args) => emit('info', args);
      console.warn = (...args) => emit('warn', args);
      console.error = (...args) => emit('error', args);
      window.onerror = (msg, _src, line) => {
        emit('error', ['Runtime Error (line ' + line + '): ' + msg]);
      };
      try {
        ${code}
      } catch (err) {
        emit('error', [err && err.message ? err.message : String(err)]);
      }
    })();
  </script>
</body>
</html>`;
  }, [code, policy, runCounter]);

  const handleSelectPreset = (id: string) => {
    const found = SANDBOX_PRESETS.find((p) => p.id === id);
    if (!found) return;
    setSelectedPresetId(id);
    setCode(found.code);
    setLogs([]);
    setSandboxStatus('running');
    setRunCounter((c) => c + 1);
  };

  const handleRun = () => {
    setLogs([]);
    setSandboxStatus('running');
    setRunCounter((c) => c + 1);
  };

  const handleWipe = () => {
    setLogs([]);
    setSandboxStatus('wiped');
    setRunCounter((c) => c + 1);
  };

  const handleDownloadPolicy = () => {
    const cfg = `# Moringa OS Sandbox Policy Export (Wrld Xavier · Wrld Tech)
[sandbox]
network = "${policy.network}"
filesystem = "${policy.filesystem}"
seccomp = "${policy.seccomp}"
memory_mb = ${policy.memoryMb}
cpu_quota_percent = ${policy.cpuPercent}
`;
    const blob = new Blob([cfg], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moringa-sandbox-profile.cfg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Built-In Virtualized Sandbox Environment
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Execute untrusted workloads inside an isolated opaque-origin container with strict
            Content-Security-Policy and ephemeral memory snapshots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Run in Isolated Sandbox</span>
          </button>

          <button
            type="button"
            onClick={handleWipe}
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Wipe Snapshot</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPolicy}
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Policy</span>
          </button>
        </div>
      </div>

      {/* Policy Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400">Network Policy</label>
          <select
            value={policy.network}
            onChange={(e) =>
              setPolicy((p) => ({ ...p, network: e.target.value as SandboxPolicy['network'] }))
            }
            className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
          >
            <option value="blocked">Offline (Blocked)</option>
            <option value="loopback">Localhost Loopback</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400">
            Filesystem Layer
          </label>
          <select
            value={policy.filesystem}
            onChange={(e) =>
              setPolicy((p) => ({
                ...p,
                filesystem: e.target.value as SandboxPolicy['filesystem'],
              }))
            }
            className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
          >
            <option value="ephemeral-tmpfs">Ephemeral RAM tmpfs</option>
            <option value="readonly-overlay">Read-Only OverlayFS</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400">Syscall Filter</label>
          <select
            value={policy.seccomp}
            onChange={(e) =>
              setPolicy((p) => ({ ...p, seccomp: e.target.value as SandboxPolicy['seccomp'] }))
            }
            className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-900 dark:text-white ${controlHeight}`}
          >
            <option value="strict">Seccomp-BPF Strict</option>
            <option value="standard">Seccomp Standard</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400">
            Memory Cap ({policy.memoryMb} MB)
          </label>
          <input
            type="range"
            min={256}
            max={4096}
            step={256}
            value={policy.memoryMb}
            onChange={(e) => setPolicy((p) => ({ ...p, memoryMb: Number(e.target.value) }))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] p-4 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">Containment Status</div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 pt-1">
            {sandboxStatus === 'wiped' ? (
              <>
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Snapshot Wiped</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Isolated Container #{runCounter}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workload Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Sandbox Workloads:</span>
        {SANDBOX_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset.id)}
            className={`rounded-lg border text-xs font-medium px-3 transition-colors whitespace-nowrap shrink-0 ${controlHeight} ${
              selectedPresetId === preset.id
                ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Sandbox Split: Code Editor + Isolated Iframe Viewport & Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-6 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Workload Payload (JS / DOM inside Sandbox)
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              sandbox=&quot;allow-scripts&quot;
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            aria-label="Sandbox workload code editor"
            className="flex-1 min-h-[340px] w-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 focus:outline-none resize-none"
          />
        </div>

        <div className="xl:col-span-6 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Isolated Execution Viewport
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Opaque Origin Isolated</span>
              </span>
            </div>
            <iframe
              key={runCounter}
              title="Moringa OS Isolated Virtual Sandbox"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="w-full h-[250px] bg-[#091116] border-0"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Container Audit &amp; Console Output
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {logs.length} events
              </span>
            </div>
            <div className="max-h-[180px] overflow-y-auto p-4 font-mono text-xs space-y-1.5 bg-slate-950 text-slate-200">
              {logs.length === 0 ? (
                <div className="text-slate-500">
                  Awaiting execution events. Click &quot;Run in Isolated Sandbox&quot; to test.
                </div>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <span className="text-slate-500 tabular-nums shrink-0">{entry.timestamp}</span>
                    <span
                      className={
                        entry.level === 'error'
                          ? 'text-red-400'
                          : entry.level === 'warn'
                          ? 'text-amber-400'
                          : 'text-emerald-300'
                      }
                    >
                      {entry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  ACADEMIC_TRACKS,
  CROSS_PLATFORM_APPS,
  DEVICE_PROFILES,
  INITIAL_CONTAINERS,
  INITIAL_HARDENING_CONTROLS,
  INITIAL_K8S_PODS,
  README_CONTENT,
} from '../data/osCatalog';
import {
  DeviceProfileId,
  InputMode,
} from '../types/os';

interface TerminalShellProps {
  deviceProfile: DeviceProfileId;
  inputMode: InputMode;
  initialCommand?: string | null;
  onInitialCommandConsumed?: () => void;
}

interface HistoryEntry {
  id: number;
  command?: string;
  output: string[];
}

const VIRTUAL_FILES: Record<string, string> = {
  '/home/wrldxavier/README.md': README_CONTENT.slice(0, 750) + '\n... (open Docs view for full README.md)',
  '/etc/moringa-release':
    'NAME="Moringa OS"\nVERSION="1.0 LTS"\nDEVELOPER="Wrld Xavier"\nVENDOR="Wrld Tech"\nSANDBOX="bubblewrap+seccomp-bpf"',
  '/etc/sandbox-profile.cfg':
    '[sandbox]\nengine = "bubblewrap-seccomp-v2"\nrootfs_mode = "read-only-overlayfs"\nephemeral_tmpfs = true',
};

export const TerminalShell: React.FC<TerminalShellProps> = ({
  deviceProfile,
  inputMode,
  initialCommand,
  onInitialCommandConsumed,
}) => {
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [entries, setEntries] = useState<HistoryEntry[]>([
    {
      id: 1,
      output: [
        'Moringa OS 1.0 LTS — Wrld Tech (Developer: Wrld Xavier)',
        'Type "help" to list available commands, or tap a Touch Quick Command below.',
      ],
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const isTouch = inputMode === 'touch';

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let out: string[] = [];

    if (cmd === 'clear') {
      setEntries([]);
      setInput('');
      return;
    } else if (cmd === 'help') {
      out = [
        'Available Moringa OS Commands:',
        '  sysinfo               Show OS kernel, developer, and active device profile',
        '  uname -a              Print kernel and architecture string',
        '  docker ps             List running Docker/Podman lab containers',
        '  docker exec ...       Open interactive shell inside a running container',
        '  kubectl get pods      Inspect local K3s Kubernetes pods and namespaces',
        '  ctf-vpn status        Inspect TryHackMe / Hack The Box isolated tun0 status',
        '  sysctl -a             Print enforced kernel hardening sysctl flags',
        '  moringa-install       Check UEFI/TPM2 bare-metal installation readiness',
        '  track list            Show Tech Institution student tracks (Cyber/SWE/Data)',
        '  moringa-compat        List Linux, Windows, and macOS compatibility bridges',
        '  sandbox-ctl status    Show active Seccomp-BPF & namespace containment status',
        '  hardware-probe        Probe hardware drivers for active device profile',
        '  usb-info              Show Live USB UEFI/BIOS partition capabilities',
        '  ls / cat <file>       List or inspect virtual workspace configuration files',
        '  clear                 Clear terminal scrollback',
      ];
    } else if (cmd === 'whoami') {
      out = ['wrldxavier (uid=1000, groups=wheel,kvm,docker,secstudent,sandbox-admin) — Wrld Tech'];
    } else if (cmd === 'uname') {
      out = ['Linux moringa-workstation 6.12.14-moringa-lts #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'];
    } else if (cmd === 'sysinfo') {
      const profile = DEVICE_PROFILES[deviceProfile];
      out = [
        `OS:            Moringa OS 1.0 LTS (Institutional & CTF Edition)`,
        `Developer:     Wrld Xavier (Wrld Tech)`,
        `Device Profile:${profile.label} (${profile.powerProfile})`,
        `CPU / Memory:  ${profile.cpuCores} Threads · ${profile.memoryCeiling}`,
        `Input Mode:    ${inputMode === 'touch' ? 'Touch Optimized (44px+)' : 'Keyboard Driven'}`,
        `Runtimes:      Docker/Podman, K3s Kubernetes, ELF64, WinBridge, DarwinBridge`,
      ];
    } else if (cmd === 'docker') {
      if (args[0] === 'ps') {
        out = [
          'CONTAINER ID   NAME                        STATUS    PORTS',
          ...INITIAL_CONTAINERS.map(
            (c) => `${c.id.padEnd(14)} ${c.name.padEnd(27)} ${c.status.padEnd(9)} ${c.ports}`
          ),
        ];
      } else if (args[0] === 'exec') {
        const target = args.find((a) => !a.startsWith('-')) || 'moringa-ctf-kali-tools';
        const containerName = args[2] || target;
        out = [
          `[docker-exec] Attached to isolated namespace of "${containerName}"`,
          `root@${containerName}:/# id`,
          `uid=0(root-in-userns) gid=0(root) capabilities=cap_net_raw,cap_net_bind_service`,
          `[sandbox] Host rootfs remains read-only and unmounted.`,
        ];
      } else {
        out = ['Usage: docker ps | docker exec -it <container> /bin/sh'];
      }
    } else if (cmd === 'kubectl') {
      out = [
        'NAMESPACE       NAME                          READY   STATUS    NODE',
        ...INITIAL_K8S_PODS.map(
          (p) =>
            `${p.namespace.padEnd(15)} ${p.name.padEnd(29)} ${p.replicas}/${p.replicas}     ${p.status.padEnd(9)} ${p.node}`
        ),
      ];
    } else if (cmd === 'ctf-vpn') {
      out = [
        'Interface:  tun0 (Isolated Network Namespace: ctf-range)',
        'Providers:  TryHackMe (THM) / Hack The Box (HTB) OpenVPN + WireGuard',
        'Tunnel IP:  10.10.14.8/16',
        'Killswitch: nftables drop unsolicited LAN/WAN cross-bleed [ENFORCED]',
      ];
    } else if (cmd === 'sysctl') {
      out = INITIAL_HARDENING_CONTROLS.map(
        (h) => `${h.enabled ? '[ENFORCED]' : '[DISABLED]'} ${h.parameter}`
      );
    } else if (cmd === 'moringa-install') {
      out = [
        'UEFI Firmware:        UEFI 2.8 (Secure Boot Ready)',
        'TPM 2.0:              Detected (/dev/tpmrm0)',
        'CPU Virtualization:   VT-x / AMD-V + KVM Ready',
        'Target NVMe Disk:     /dev/nvme0n1 (GPT + Btrfs + LUKS2 Supported)',
        'Compatibility:        Ready for bare-metal installation on this device.',
      ];
    } else if (cmd === 'track') {
      out = ACADEMIC_TRACKS.map(
        (t) => `${t.title.padEnd(36)} | ${t.certifications}`
      );
    } else if (cmd === 'ls') {
      out = [
        'README.md',
        'os/moringa-usb-builder.sh',
        'os/sandbox-profile.cfg',
        '/etc/moringa-release',
        '/etc/sandbox-profile.cfg',
      ];
    } else if (cmd === 'cat') {
      const target = args[0] || '';
      if (target === 'README.md') {
        out = VIRTUAL_FILES['/home/wrldxavier/README.md'].split('\n');
      } else if (VIRTUAL_FILES[target]) {
        out = VIRTUAL_FILES[target].split('\n');
      } else {
        out = [`cat: ${target || '(missing file)'}: No such file in virtual workspace.`];
      }
    } else if (cmd === 'moringa-compat') {
      out = CROSS_PLATFORM_APPS.map(
        (a) => `[${a.origin.toUpperCase().padEnd(7)}] ${a.name.padEnd(28)} -> ${a.bridgeEngine}`
      );
    } else if (cmd === 'sandbox-ctl') {
      out = [
        'Sandbox Engine: Bubblewrap + Seccomp-BPF v2',
        'Rootfs:         Immutable SquashFS + Ephemeral RAM tmpfs',
        'Network:        Namespace isolated (default: offline)',
      ];
    } else if (cmd === 'hardware-probe') {
      const profile = DEVICE_PROFILES[deviceProfile];
      out = profile.hardwareMatrix.map(
        (m) => `[OK] ${m.subsystem.padEnd(24)} | ${m.driverStack} | ${m.capability}`
      );
    } else if (cmd === 'usb-info') {
      out = [
        'Boot Modes:     UEFI Secure Boot + Legacy BIOS Hybrid GPT',
        'Persistence:    Optional LUKS2 encrypted volume (16 GB - 128 GB)',
        'Builder Script: ./os/moringa-usb-builder.sh',
      ];
    } else {
      out = [`moringa-sh: command not found: ${cmd}. Type "help" for valid commands.`];
    }

    setEntries((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), command: trimmed, output: out },
    ]);
    setCmdHistory((prev) => [trimmed, ...prev.slice(0, 29)]);
    setHistoryIdx(-1);
    setInput('');
  };

  useEffect(() => {
    if (initialCommand) {
      runCommand(initialCommand);
      onInitialCommandConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCommand]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      if (cmdHistory[nextIdx]) {
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      if (nextIdx < 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    }
  };

  const quickCommands = [
    'sysinfo',
    'hardware-probe',
    'moringa-compat',
    'sandbox-ctl status',
    'usb-info',
    'ls',
    'clear',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Moringa POSIX Shell
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Interactive system shell supporting keyboard arrow history and touch quick-command
            triggers.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          wrldxavier@moringa-os
        </span>
      </div>

      {/* Touch & Quick Command Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => runCommand(cmd)}
            className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] hover:border-emerald-600 dark:hover:border-emerald-500 font-mono text-xs text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 px-3 ${
              isTouch ? 'min-h-[44px]' : 'min-h-[34px]'
            }`}
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Surface */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-5 font-mono text-xs leading-relaxed min-h-[400px] flex flex-col justify-between cursor-text"
      >
        <div className="space-y-3 overflow-y-auto max-h-[460px]">
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-1">
              {entry.command && (
                <div className="text-emerald-400">
                  <span className="text-slate-500">wrldxavier@moringa:~$</span> {entry.command}
                </div>
              )}
              {entry.output.map((line, i) => (
                <div key={i} className="text-slate-200 whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800/90">
          <span className="text-emerald-400 shrink-0">wrldxavier@moringa:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command (e.g. sysinfo, help)..."
            aria-label="Moringa OS Terminal Input"
            className={`flex-1 bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none ${
              isTouch ? 'min-h-[44px]' : 'min-h-[32px]'
            }`}
          />
          <button
            type="button"
            onClick={() => runCommand(input)}
            className={`rounded-md bg-emerald-700 hover:bg-emerald-600 text-white px-3 text-xs font-sans font-medium transition-colors shrink-0 ${
              isTouch ? 'min-h-[44px] px-4' : 'min-h-[30px]'
            }`}
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
};

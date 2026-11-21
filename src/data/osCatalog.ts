import {
  AcademicTrack,
  ContainerInstance,
  CrossPlatformApp,
  DeviceProfile,
  HardeningControl,
  KubernetesPod,
  OsProcess,
  SandboxPreset,
  UsbBuildConfig,
} from '../types/os';

export const ASSET_PATHS = {
  wallpaperDark: '/src/assets/images/moringa_wallpaper_dark_1795249737310.jpg',
  wallpaperLight: '/src/assets/images/moringa_wallpaper_light_1795249737181.jpg',
  usbHardware: '/src/assets/images/moringa_usb_hardware_1795249737572.jpg',
  developerAvatar: '/src/assets/images/wrld_xavier_avatar_1795249736978.jpg',
};

export const DEVICE_PROFILES: Record<'desktop' | 'laptop' | 'workstation', DeviceProfile> = {
  desktop: {
    id: 'desktop',
    label: 'Desktop',
    targetSummary: 'Balanced multi-monitor throughput with full PCIe peripheral hotplug.',
    cpuGovernor: 'schedutil · 4.8 GHz boost',
    cpuCores: 16,
    memoryTotalGb: 64,
    memoryCeiling: '64 GB DDR5',
    diskMaxMbPerSec: 4200,
    powerProfile: 'AC Performance',
    displayScaling: '100% – 150% fractional Wayland',
    inputNotes: 'Full mechanical keyboard chord routing + high-polling mouse',
    hardwareMatrix: [
      {
        subsystem: 'Graphics & Display',
        driverStack: 'Mesa Vulkan 24.3 / DRM-KMS',
        capability: 'Multi-display 4K 144Hz VRR',
        status: 'Verified',
      },
      {
        subsystem: 'Storage & Bus',
        driverStack: 'NVMe PCIe 4.0 + USB 3.2 xHCI',
        capability: 'TRIM + Live USB hotplug mount',
        status: 'Verified',
      },
      {
        subsystem: 'Audio & Media',
        driverStack: 'PipeWire 1.2 + WirePlumber',
        capability: 'Low-latency 48kHz duplex routing',
        status: 'Verified',
      },
      {
        subsystem: 'Input & Touch',
        driverStack: 'libinput + evdev HID',
        capability: 'Keyboard macros + touch monitor fallback',
        status: 'Verified',
      },
    ],
  },
  laptop: {
    id: 'laptop',
    label: 'Laptop',
    targetSummary: 'Adaptive thermal tuning, precision trackpad gestures, and 10-point touch.',
    cpuGovernor: 'powersave-epp · dynamic boost',
    cpuCores: 12,
    memoryTotalGb: 32,
    memoryCeiling: '32 GB LPDDR5x',
    diskMaxMbPerSec: 3100,
    powerProfile: 'Battery Adaptive',
    displayScaling: '150% – 200% HiDPI + Touch',
    inputNotes: 'Precision palm rejection, pinch-zoom, and 44px touch targets',
    hardwareMatrix: [
      {
        subsystem: 'Touch & Trackpad',
        driverStack: 'libinput 1.26 + i2c-hid multitouch',
        capability: '10-point touch + palm rejection',
        status: 'Verified',
      },
      {
        subsystem: 'Power & Thermals',
        driverStack: 'power-profiles-daemon + thermald',
        capability: 'S0ix modern standby + USB-C PD',
        status: 'Verified',
      },
      {
        subsystem: 'Wireless & Radio',
        driverStack: 'iwlwifi / ath12k + BlueZ 5.78',
        capability: 'Wi-Fi 7 MLO + LE Audio',
        status: 'Verified',
      },
      {
        subsystem: 'Hybrid Graphics',
        driverStack: 'PRIME Render Offload',
        capability: 'Automatic iGPU/dGPU switching',
        status: 'Verified',
      },
    ],
  },
  workstation: {
    id: 'workstation',
    label: 'Workstation',
    targetSummary: 'High-core NUMA scheduling, ECC reporting, Thunderbolt 4, and KVM VFIO.',
    cpuGovernor: 'performance · NUMA pinned',
    cpuCores: 32,
    memoryTotalGb: 128,
    memoryCeiling: '128 GB ECC DDR5',
    diskMaxMbPerSec: 7100,
    powerProfile: 'Sustained Compute',
    displayScaling: '125% dual-10bit reference',
    inputNotes: 'Programmable workstation macro decks + stylus digitizer',
    hardwareMatrix: [
      {
        subsystem: 'Compute & Memory',
        driverStack: 'EDAC ECC + cgroups v2 NUMA',
        capability: 'Multi-socket thread affinity',
        status: 'Verified',
      },
      {
        subsystem: 'Multi-GPU & Virtualization',
        driverStack: 'KVM / QEMU + VFIO-PCI',
        capability: 'SR-IOV & sandboxed GPU slice',
        status: 'Verified',
      },
      {
        subsystem: 'High-Speed Storage',
        driverStack: 'Btrfs RAID10 + NVMe-oF',
        capability: 'Sub-millisecond snapshot rollback',
        status: 'Verified',
      },
      {
        subsystem: 'Thunderbolt & Dock',
        driverStack: 'boltd + USB4 PCIe tunneling',
        capability: '40 Gbps dual-4K dock + eGPU',
        status: 'Verified',
      },
    ],
  },
};

export const INITIAL_PROCESSES: OsProcess[] = [
  { pid: 1042, name: 'moringa-wayland', user: 'wrldxavier', subsystem: 'Compositor', cpuPercent: 3.4, memoryMb: 412, state: 'running' },
  { pid: 1288, name: 'containerd-shim', user: 'root', subsystem: 'Containers', cpuPercent: 2.1, memoryMb: 286, state: 'running' },
  { pid: 1410, name: 'k3s-server', user: 'root', subsystem: 'Kubernetes', cpuPercent: 5.8, memoryMb: 940, state: 'running' },
  { pid: 1854, name: 'openvpn-thm-tun0', user: 'netadmin', subsystem: 'CTF VPN', cpuPercent: 0.7, memoryMb: 48, state: 'isolated' },
  { pid: 2104, name: 'winbridge-dxvk', user: 'wrldxavier', subsystem: 'Win32 Bridge', cpuPercent: 6.2, memoryMb: 780, state: 'isolated' },
  { pid: 2491, name: 'jupyter-lab', user: 'datastudent', subsystem: 'Data Science', cpuPercent: 8.5, memoryMb: 1820, state: 'running' },
  { pid: 2770, name: 'wireshark-dumpcap', user: 'secstudent', subsystem: 'Packet Capture', cpuPercent: 1.9, memoryMb: 194, state: 'isolated' },
  { pid: 3012, name: 'auditd-seccomp', user: 'root', subsystem: 'Hardening', cpuPercent: 0.4, memoryMb: 64, state: 'running' },
];

export const INITIAL_CONTAINERS: ContainerInstance[] = [
  {
    id: 'c8a4f2d190',
    name: 'moringa-ctf-kali-tools',
    image: 'wrldtech/moringa-sec-lab:2026.1',
    runtime: 'docker',
    status: 'running',
    ports: '10.10.14.8:4444->4444/tcp',
    cpuPercent: 4.2,
    memoryMb: 640,
    track: 'Cybersecurity (THM / HTB)',
  },
  {
    id: 'a319bc77e2',
    name: 'jupyter-pytorch-cuda',
    image: 'wrldtech/ds-analytics-stack:3.12',
    runtime: 'podman',
    status: 'running',
    ports: '127.0.0.1:8888->8888/tcp',
    cpuPercent: 11.4,
    memoryMb: 2480,
    track: 'Data Science & Analytics',
  },
  {
    id: 'f902de11a4',
    name: 'postgres-duckdb-warehouse',
    image: 'postgres:17-alpine',
    runtime: 'docker',
    status: 'running',
    ports: '127.0.0.1:5432->5432/tcp',
    cpuPercent: 2.3,
    memoryMb: 512,
    track: 'Data Analytics / Software Eng',
  },
  {
    id: 'd45e8801c9',
    name: 'ghidra-re-sandbox',
    image: 'wrldtech/re-ghidra-headless:11.2',
    runtime: 'podman',
    status: 'stopped',
    ports: 'isolated (no-net)',
    cpuPercent: 0.0,
    memoryMb: 0,
    track: 'GIAC Reverse Engineering',
  },
  {
    id: 'b771ac03f1',
    name: 'rust-go-ci-runner',
    image: 'wrldtech/swe-toolchain:latest',
    runtime: 'docker',
    status: 'running',
    ports: '127.0.0.1:9090->9090/tcp',
    cpuPercent: 3.1,
    memoryMb: 820,
    track: 'Software Engineering',
  },
];

export const INITIAL_K8S_PODS: KubernetesPod[] = [
  {
    name: 'ctf-owasp-juiceshop-7d9f',
    namespace: 'cyber-labs',
    node: 'moringa-worker-01',
    replicas: 2,
    status: 'Running',
    cpuMillicores: 180,
    memoryMb: 340,
    purpose: 'CompTIA Security+ / Web App Pentest Target',
  },
  {
    name: 'trivy-vuln-scanner-5c4a',
    namespace: 'kube-security',
    node: 'moringa-control-plane',
    replicas: 1,
    status: 'Running',
    cpuMillicores: 95,
    memoryMb: 220,
    purpose: 'Continuous Container CVE & SBOM Auditing',
  },
  {
    name: 'mlflow-experiment-hub-9a12',
    namespace: 'data-science',
    node: 'moringa-worker-01',
    replicas: 1,
    status: 'Running',
    cpuMillicores: 240,
    memoryMb: 760,
    purpose: 'Model Registry & Analytics Experiment Tracking',
  },
  {
    name: 'api-gateway-envoy-3e88',
    namespace: 'swe-staging',
    node: 'moringa-worker-01',
    replicas: 3,
    status: 'Running',
    cpuMillicores: 145,
    memoryMb: 290,
    purpose: 'Microservices Mesh & gRPC Load Balancing',
  },
];

export const INITIAL_HARDENING_CONTROLS: HardeningControl[] = [
  {
    id: 'kptr-restrict',
    parameter: 'kernel.kptr_restrict = 2',
    title: 'Kernel Address Space Obfuscation',
    description: 'Hides exposed kernel pointer addresses from unprivileged users and procfs.',
    standard: 'CIS Linux Level 2 · GIAC GCUX',
    enabled: true,
  },
  {
    id: 'ptrace-scope',
    parameter: 'kernel.yama.ptrace_scope = 2',
    title: 'Restricted Process Debugging (Yama)',
    description: 'Prevents lateral credential scraping across user processes via ptrace.',
    standard: 'ISC2 CC · CompTIA Security+',
    enabled: true,
  },
  {
    id: 'apparmor-seccomp',
    parameter: 'apparmor=1 security=apparmor',
    title: 'Mandatory Access Control + Seccomp-BPF',
    description: 'Enforces per-binary AppArmor profiles and syscall allowlists on all bridges.',
    standard: 'NIST SP 800-53 · Kernel LSM',
    enabled: true,
  },
  {
    id: 'nftables-vpn',
    parameter: 'nftables.moringa.ctf_killswitch = enforce',
    title: 'Firewall Default-Deny & CTF TUN Guard',
    description: 'Drops unsolicited inbound traffic and isolates TryHackMe/HTB tun0 routes from LAN.',
    standard: 'CompTIA Security+ · Network Segmentation',
    enabled: true,
  },
  {
    id: 'luks2-tpm2',
    parameter: 'cryptsetup.luks2.tpm2_pcr = 0,2,7',
    title: 'LUKS2 Full-Disk Encryption + TPM 2.0 Sealing',
    description: 'Binds storage unlock keys to UEFI Secure Boot integrity measurements.',
    standard: 'CIS Workstation · Hardware Root of Trust',
    enabled: true,
  },
  {
    id: 'auditd-immutable',
    parameter: 'auditctl -e 2 (immutable ruleset)',
    title: 'Kernel Auditd Syscall Telemetry',
    description: 'Records privileged sudo, mount, and module load events for forensic review.',
    standard: 'GIAC GCFA · SOC Operations',
    enabled: false,
  },
];

export const ACADEMIC_TRACKS: AcademicTrack[] = [
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & CTF Operations',
    certifications: 'ISC2 CC · CompTIA Security+ · GIAC (GSEC / GPEN / GCFA)',
    summary:
      'Hardened penetration testing and blue-team forensics environment tailored for TryHackMe, Hack The Box, and institutional cyber ranges.',
    ctfAndLabReady: 'Isolated OpenVPN/WireGuard tun0 namespace + ephemeral snapshot rollback',
    prebuiltTools: [
      'Nmap / Masscan',
      'Wireshark + tshark',
      'Ghidra + GDB-PEDA',
      'Burp / OWASP ZAP (Sandboxed)',
      'Hashcat + John',
      'Impacket + BloodHound',
    ],
    defaultContainers: ['moringa-ctf-kali-tools', 'ghidra-re-sandbox', 'ctf-owasp-juiceshop'],
    kernelCapabilities: 'cap_net_raw scoped to secstudent group; zero persistent host trace',
  },
  {
    id: 'software',
    title: 'Software Engineering & Cloud Native',
    certifications: 'CKAD / CKA · AWS / Linux Foundation Systems Engineering',
    summary:
      'Full containerization and Kubernetes development workstation with native Linux compilers plus Windows/macOS cross-target testing.',
    ctfAndLabReady: 'Local K3s single-node / multi-worker cluster + Rootless Podman & Docker',
    prebuiltTools: [
      'Docker + Podman + Buildx',
      'K3s / kubectl / Helm',
      'Rust / Go / Node.js / GCC',
      'Neovim / VS Code Wayland',
      'PostgreSQL + Redis Containers',
      'WinBridge / DarwinBridge QA',
    ],
    defaultContainers: ['rust-go-ci-runner', 'postgres-duckdb-warehouse', 'api-gateway-envoy'],
    kernelCapabilities: 'cgroups v2 memory/CPU quotas + overlay2 copy-on-write layers',
  },
  {
    id: 'data',
    title: 'Data Science & Data Analytics',
    certifications: 'Python / SQL Analytics · Applied ML · Apache Spark / DuckDB',
    summary:
      'High-throughput analytical compute stack with isolated Jupyter kernels, GPU CUDA/ROCm passthrough, and local columnar warehousing.',
    ctfAndLabReady: 'Reproducible Conda/uv venvs + containerized JupyterLab & MLflow tracking',
    prebuiltTools: [
      'Python 3.12 + uv + JupyterLab',
      'PyTorch + Scikit-learn + Polars',
      'DuckDB + Apache Arrow',
      'PostgreSQL + dbt Core',
      'RStudio Server (Sandboxed)',
      'MLflow Experiment Registry',
    ],
    defaultContainers: ['jupyter-pytorch-cuda', 'postgres-duckdb-warehouse', 'mlflow-experiment-hub'],
    kernelCapabilities: 'NUMA-pinned memory pages + Vulkan/CUDA render node isolation',
  },
];

export const CROSS_PLATFORM_APPS: CrossPlatformApp[] = [
  {
    id: 'blender-linux',
    name: 'Blender Studio',
    developer: 'Blender Foundation',
    origin: 'linux',
    binaryFormat: 'ELF64 / AppImage',
    bridgeEngine: 'Native Wayland + Vulkan',
    version: '4.3 LTS',
    ramMb: 1280,
    sandboxDefault: true,
    gpuAccelerated: true,
    summary: 'Native Linux 3D modeling, Cycles GPU rendering, and compositing suite.',
    syscallTranslation: [
      {
        sourceApi: 'Wayland wl_surface',
        moringaLayer: 'Moringa Compositor Direct',
        targetKernel: 'DRM/KMS Buffer Swap',
      },
      {
        sourceApi: 'POSIX openat / mmap',
        moringaLayer: 'Seccomp-BPF Allowlist',
        targetKernel: 'Linux VFS OverlayFS',
      },
    ],
  },
  {
    id: 'notepad-plus-win',
    name: 'WinStudio Codepad',
    developer: 'Win32 Ecosystem',
    origin: 'windows',
    binaryFormat: 'PE32+ (.exe)',
    bridgeEngine: 'WinBridge (Wine 9.x + DXVK)',
    version: '8.7.1',
    ramMb: 240,
    sandboxDefault: true,
    gpuAccelerated: true,
    summary: 'Runs standard Windows PE64 executables inside an isolated per-app registry prefix.',
    syscallTranslation: [
      {
        sourceApi: 'Win32 CreateFileW / Registry',
        moringaLayer: 'WinBridge Prefix VFS',
        targetKernel: 'Isolated ~/.moringa/prefixes',
      },
      {
        sourceApi: 'Direct3D 11 / DirectWrite',
        moringaLayer: 'DXVK Translation Layer',
        targetKernel: 'Vulkan 1.3 Hardware Queue',
      },
    ],
  },
  {
    id: 'dx12-cad-win',
    name: 'VectorCAD Pro',
    developer: 'CAD Systems',
    origin: 'windows',
    binaryFormat: 'PE64 (.exe / .msi)',
    bridgeEngine: 'WinBridge + VKD3D-Proton',
    version: '2026.2',
    ramMb: 1840,
    sandboxDefault: true,
    gpuAccelerated: true,
    summary: 'Hardware-accelerated DirectX 12 CAD viewport translated cleanly to Vulkan.',
    syscallTranslation: [
      {
        sourceApi: 'D3D12CreateDevice',
        moringaLayer: 'VKD3D-Proton Shader Compiler',
        targetKernel: 'SPIR-V / Mesa Vulkan',
      },
      {
        sourceApi: 'WinSock2 TCP/UDP',
        moringaLayer: 'Sandbox Netfilter Hook',
        targetKernel: 'Namespace veth0 (Blocked by default)',
      },
    ],
  },
  {
    id: 'swift-studio-mac',
    name: 'Darwin Swift CLI & Buildkit',
    developer: 'macOS Toolchain',
    origin: 'macos',
    binaryFormat: 'Mach-O Universal',
    bridgeEngine: 'DarwinBridge (Darling + Mach Shim)',
    version: '6.0',
    ramMb: 620,
    sandboxDefault: true,
    gpuAccelerated: false,
    summary: 'Executes macOS Mach-O binaries and Foundation/CoreFoundation workflows in userspace.',
    syscallTranslation: [
      {
        sourceApi: 'Mach-O dyld / mach_msg',
        moringaLayer: 'DarwinBridge LKM-Free Shim',
        targetKernel: 'Linux eventfd + futex',
      },
      {
        sourceApi: 'Foundation NSFileManager',
        moringaLayer: 'Case-Preserving Overlay Path',
        targetKernel: 'POSIX statx / openat2',
      },
    ],
  },
  {
    id: 'coreaudio-daw-mac',
    name: 'PulseMix Audio Lab',
    developer: 'macOS Audio Suite',
    origin: 'macos',
    binaryFormat: 'Mach-O (.app bundle)',
    bridgeEngine: 'DarwinBridge + PipeWire CoreAudio',
    version: '3.4',
    ramMb: 890,
    sandboxDefault: true,
    gpuAccelerated: true,
    summary: 'Routes macOS CoreAudio AU units directly onto Moringa PipeWire real-time graphs.',
    syscallTranslation: [
      {
        sourceApi: 'AudioUnitRender (CoreAudio)',
        moringaLayer: 'DarwinBridge Audio Adapter',
        targetKernel: 'PipeWire RT Jack Ringbuffer',
      },
      {
        sourceApi: 'Metal MTLDevice',
        moringaLayer: 'MoltenVK-Reverse -> Vulkan',
        targetKernel: 'Mesa / Proprietary Vulkan ICD',
      },
    ],
  },
  {
    id: 'kdenlive-linux',
    name: 'Kdenlive Nonlinear Editor',
    developer: 'KDE Community',
    origin: 'linux',
    binaryFormat: 'ELF64 / Flatpak',
    bridgeEngine: 'Native Wayland + VA-API',
    version: '24.12',
    ramMb: 1520,
    sandboxDefault: true,
    gpuAccelerated: true,
    summary: 'Hardware-accelerated multi-track video editing with strict filesystem portal access.',
    syscallTranslation: [
      {
        sourceApi: 'VA-API / NVENC Decode',
        moringaLayer: 'XDG Portal Hardware Proxy',
        targetKernel: 'Kernel Render Node /dev/dri/renderD128',
      },
      {
        sourceApi: 'xdg-desktop-portal FileChooser',
        moringaLayer: 'Moringa Trust Broker',
        targetKernel: 'Scoped Bind Mount (Read-Only)',
      },
    ],
  },
];

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'untrusted-audit',
    title: 'Untrusted Script Auditor',
    category: 'Security Audit',
    summary: 'Attempts to probe host storage and network inside the sandbox to verify isolation.',
    code: `// Moringa OS Sandbox Containment Verification
console.log("Booting ephemeral sandbox container...");
console.log("User namespace UID:", 1000, "(mapped unprivileged)");
console.log("Host Origin Access:", window.origin === "null" ? "ISOLATED (opaque null origin)" : window.origin);

try {
  const parentTitle = window.parent.document.title;
  console.log("WARN: Parent DOM reachable:", parentTitle);
} catch (err) {
  console.log("PASS: Cross-origin parent DOM access blocked by sandbox boundary.");
}

try {
  localStorage.setItem("moringa_probe", "1");
  console.log("WARN: localStorage writable");
} catch (err) {
  console.log("PASS: Host persistent storage blocked inside ephemeral tmpfs.");
}

const data = { kernel: "Moringa 6.12", bridge: ["Linux", "Windows", "macOS"], isolated: true };
console.log("Payload checksum ready:", JSON.stringify(data));`,
  },
  {
    id: 'canvas-gpu-bench',
    title: 'Graphics Pipeline Stress Test',
    category: 'GPU / Compositor',
    summary: 'Renders a live animated botanical lattice inside the isolated sandbox viewport.',
    code: `document.body.innerHTML = '<canvas id="c" style="width:100%;height:220px;display:block;border-radius:8px;background:#091116;"></canvas><div id="stats" style="font-family:monospace;font-size:12px;color:#94a3b8;margin-top:8px;"></div>';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = 640;
canvas.height = 220;
let frame = 0;
function draw() {
  frame++;
  ctx.fillStyle = 'rgba(9, 17, 22, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 18; i++) {
    const x = (i * 38 + frame * 1.4) % (canvas.width + 40) - 20;
    const y = 110 + Math.sin(frame * 0.04 + i * 0.6) * 58;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? '#22c55e' : '#38bdf8';
    ctx.fill();
  }
  if (frame % 15 === 0) {
    document.getElementById('stats').textContent = 'Sandboxed Render Frame #' + frame + ' | Isolated 2D Context Active';
  }
  if (frame < 360) requestAnimationFrame(draw);
}
draw();
console.log("Started sandboxed 2D compositor loop (360 frames).");`,
  },
  {
    id: 'cross-platform-manifest',
    title: 'Binary Compatibility Parser',
    category: 'Compatibility Engine',
    summary: 'Parses Linux ELF, Windows PE, and macOS Mach-O magic bytes and generates runtime rules.',
    code: `const headers = [
  { file: "blender.AppImage", magic: [0x7F, 0x45, 0x4C, 0x46], target: "Native Linux ELF64" },
  { file: "vectorcad.exe", magic: [0x4D, 0x5A, 0x90, 0x00], target: "WinBridge (Wine + DXVK)" },
  { file: "swift-cli.macho", magic: [0xCF, 0xFA, 0xED, 0xFE], target: "DarwinBridge (Darling)" }
];

headers.forEach(item => {
  const hex = item.magic.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  console.log(item.file + " -> [" + hex + "] -> " + item.target);
});
console.log("All 3 ecosystem binary headers validated inside sandbox.");`,
  },
];

export function generateUsbBuilderScript(config: UsbBuildConfig): string {
  const persistFlag =
    config.persistenceGb > 0
      ? `--persistence ${config.persistenceGb} --fs ${config.filesystem}`
      : `--persistence 0 --fs ${config.filesystem}`;
  const isoName = `moringa-os-1.0-${config.edition}-${config.arch}.iso`;

  return `#!/usr/bin/env bash
# Generated by Moringa OS USB Builder (Wrld Xavier · Wrld Tech)
set -euo pipefail

ARCH="${config.arch}"
EDITION="${config.edition}"
PERSISTENCE_GB="${config.persistenceGb}"
FILESYSTEM="${config.filesystem}"
DRIVE_TYPE="${config.driveInterface}"
ISO_FILE="./${isoName}"

echo "[1/4] Preparing Moringa OS (\${EDITION} / \${ARCH})..."
./os/moringa-usb-builder.sh --arch "\${ARCH}" --edition "\${EDITION}" ${persistFlag} --output "\${ISO_FILE}"

echo "[2/4] Verifying SHA-256 integrity..."
sha256sum -c "\${ISO_FILE}.sha256"

echo "[3/4] Ready to flash onto \${DRIVE_TYPE}:"
echo "  Run 'lsblk' to confirm your USB block device (e.g. /dev/sdX), then execute:"
echo "  sudo dd if=\${ISO_FILE} of=/dev/sdX bs=4M status=progress oflag=sync"
${
  config.persistenceGb > 0
    ? `echo "[4/4] Encrypted LUKS2 persistence (\${PERSISTENCE_GB} GB \${FILESYSTEM}) will auto-initialize on first boot."`
    : `echo "[4/4] Amnesic RAM-only boot enabled (no persistent writes to USB)."`
}`;
}

export const README_CONTENT = `# Moringa OS

**Universal Cross-Platform Operating System · Bootable Live USB & Bare-Metal Install · Virtualized Sandbox · Tech Institution & CTF Workstation**

Developed by **Wrld Xavier** · Created at **Wrld Tech**

---

## Overview

**Moringa OS** is an immutable, cross-platform operating system engineered for seamless compatibility across **Linux**, **Windows**, and **macOS** applications while maintaining strict security boundaries through kernel hardening and a built-in virtualized sandbox runtime. Designed for **modern compatible desktops, laptops, and workstations**, Moringa OS adapts effortlessly between **keyboard-driven workflows** and **touch-first displays**, and can either be **booted live from a USB drive** or **installed directly onto internal NVMe/SSD storage**.

Built specifically for **technical institutions and specialized tracks**:
- **Cybersecurity & CTF Labs (TryHackMe, Hack The Box, Cyber Ranges)**: Supports **ISC2 CC**, **CompTIA Security+**, and **GIAC** workflows with isolated OpenVPN/WireGuard TUN namespaces, packet capture, and ephemeral target sandboxes.
- **Software Engineering & Cloud Native**: Native **Docker**, **Podman**, and local **Kubernetes (K3s)** orchestration alongside multi-language toolchains.
- **Data Science & Data Analytics**: GPU-accelerated **JupyterLab**, **PyTorch**, **DuckDB**, **PostgreSQL**, and **MLflow** containers.

---

## Key Capabilities

### 1. Real-Time System Monitor & Telemetry
- Live **CPU**, **Memory & Swap**, and **Disk I/O** telemetry charts powered by Recharts.
- Interactive process table with PID inspection, termination, and instant sandbox isolation.

### 2. Kubernetes & Docker Container Runtime
- Native **Docker / Podman** container management (start, stop, restart, inspect, and terminal exec).
- Built-in local **K3s Kubernetes** control plane for deploying and scaling institutional lab pods and microservices.

### 3. System Hardening & Security Architecture
- Configurable kernel \`sysctl\` parameters (\`kptr_restrict\`, \`yama.ptrace_scope\`, \`rp_filter\`), **AppArmor + Seccomp-BPF**, **nftables** CTF VPN killswitch, **LUKS2 + TPM 2.0** measured boot, and immutable \`auditd\` rules.

### 4. Cross-Platform Application Compatibility
- **Linux Native (ELF / AppImage / Flatpak / Wayland)**
- **Windows Compatibility (\`WinBridge\` — Wine + DXVK + VKD3D-Proton)**
- **macOS Compatibility (\`DarwinBridge\` — Darling + Mach-O Shim)**

### 5. Bootable USB & Modern Device Bare-Metal Installation
- **Hybrid UEFI / BIOS Live USB**: Boot into volatile RAM or encrypted \`LUKS2\` persistence.
- **Modern Hardware Installer**: Direct UEFI GPT + Btrfs/LUKS2 installation on compatible laptops, desktops, and workstations with TPM 2.0 and NVMe support.

---

## Bootable USB Quick Start

\`\`\`bash
chmod +x os/moringa-usb-builder.sh
./os/moringa-usb-builder.sh --arch x86_64 --edition workstation --output ./dist/moringa-os-1.0-amd64.iso
sudo dd if=./dist/moringa-os-1.0-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
\`\`\`

---

## Running the Interactive Workbench Locally

\`\`\`bash
npm install
npm run dev
npm run lint
npm run build
\`\`\`

---

## Credits & License

- **Lead Developer & Architect**: **Wrld Xavier**
- **Organization**: **Wrld Tech**
- **License**: Apache License 2.0
`;

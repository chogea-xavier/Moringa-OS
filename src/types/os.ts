export type DeviceProfileId = 'desktop' | 'laptop' | 'workstation';
export type InputMode = 'keyboard' | 'touch';
export type ThemeMode = 'dark' | 'light';
export type OsView =
  | 'overview'
  | 'monitor'
  | 'compatibility'
  | 'sandbox'
  | 'usb'
  | 'terminal'
  | 'docs';
export type PlatformOrigin = 'linux' | 'windows' | 'macos';
export type AcademicTrackId = 'cybersecurity' | 'software' | 'data';

export interface DeviceProfile {
  id: DeviceProfileId;
  label: string;
  targetSummary: string;
  cpuGovernor: string;
  cpuCores: number;
  memoryTotalGb: number;
  memoryCeiling: string;
  diskMaxMbPerSec: number;
  powerProfile: string;
  displayScaling: string;
  inputNotes: string;
  hardwareMatrix: Array<{
    subsystem: string;
    driverStack: string;
    capability: string;
    status: string;
  }>;
}

export interface CrossPlatformApp {
  id: string;
  name: string;
  developer: string;
  origin: PlatformOrigin;
  binaryFormat: string;
  bridgeEngine: string;
  version: string;
  ramMb: number;
  sandboxDefault: boolean;
  gpuAccelerated: boolean;
  summary: string;
  syscallTranslation: Array<{
    sourceApi: string;
    moringaLayer: string;
    targetKernel: string;
  }>;
}

export interface SandboxPreset {
  id: string;
  title: string;
  category: string;
  summary: string;
  code: string;
}

export interface SandboxPolicy {
  network: 'blocked' | 'loopback';
  filesystem: 'ephemeral-tmpfs' | 'readonly-overlay';
  seccomp: 'strict' | 'standard';
  memoryMb: number;
  cpuPercent: number;
}

export interface UsbBuildConfig {
  arch: 'x86_64' | 'arm64';
  edition: 'workstation' | 'core' | 'security';
  persistenceGb: 0 | 16 | 32 | 64 | 128;
  filesystem: 'btrfs' | 'ext4';
  driveInterface: 'usb32-flash' | 'usbc-nvme';
}

export interface OsProcess {
  pid: number;
  name: string;
  user: string;
  subsystem: string;
  cpuPercent: number;
  memoryMb: number;
  state: 'running' | 'sleeping' | 'isolated';
}

export interface ContainerInstance {
  id: string;
  name: string;
  image: string;
  runtime: 'docker' | 'podman';
  status: 'running' | 'stopped';
  ports: string;
  cpuPercent: number;
  memoryMb: number;
  track: string;
}

export interface KubernetesPod {
  name: string;
  namespace: string;
  node: string;
  replicas: number;
  status: 'Running' | 'Scaled Down' | 'Restarting';
  cpuMillicores: number;
  memoryMb: number;
  purpose: string;
}

export interface HardeningControl {
  id: string;
  parameter: string;
  title: string;
  description: string;
  standard: string;
  enabled: boolean;
}

export interface AcademicTrack {
  id: AcademicTrackId;
  title: string;
  certifications: string;
  summary: string;
  ctfAndLabReady: string;
  prebuiltTools: string[];
  defaultContainers: string[];
  kernelCapabilities: string;
}

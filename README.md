# Moringa OS

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
- Configurable kernel `sysctl` parameters (`kptr_restrict`, `yama.ptrace_scope`, `rp_filter`), **AppArmor + Seccomp-BPF**, **nftables** CTF VPN killswitch, **LUKS2 + TPM 2.0** measured boot, and immutable `auditd` rules.

### 4. Cross-Platform Application Compatibility
- **Linux Native (ELF / AppImage / Flatpak / Wayland)**
- **Windows Compatibility (`WinBridge` — Wine + DXVK + VKD3D-Proton)**
- **macOS Compatibility (`DarwinBridge` — Darling + Mach-O Shim)**

### 5. Bootable USB & Modern Device Bare-Metal Installation
- **Hybrid UEFI / BIOS Live USB**: Boot into volatile RAM or encrypted `LUKS2` persistence.
- **Modern Hardware Installer**: Direct UEFI GPT + Btrfs/LUKS2 installation on compatible laptops, desktops, and workstations with TPM 2.0 and NVMe support.

---

## Bootable USB Quick Start

```bash
chmod +x os/moringa-usb-builder.sh
./os/moringa-usb-builder.sh --arch x86_64 --edition workstation --output ./dist/moringa-os-1.0-amd64.iso
sudo dd if=./dist/moringa-os-1.0-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

---

## Running the Interactive Workbench Locally

```bash
npm install
npm run dev
npm run lint
npm run build
```

---

## Credits & License

- **Lead Developer & Architect**: **Wrld Xavier**
- **Organization**: **Wrld Tech**
- **License**: Apache License 2.0

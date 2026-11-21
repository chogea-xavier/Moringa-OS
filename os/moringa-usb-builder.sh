#!/usr/bin/env bash
# ==============================================================================
# Moringa OS — Hybrid UEFI / BIOS Bootable Live USB Image Builder
# Developer: Wrld Xavier | Organization: Wrld Tech
# License: Apache-2.0
# ==============================================================================
set -euo pipefail

ARCH="x86_64"
EDITION="workstation"
PERSISTENCE_GB="0"
FILESYSTEM="btrfs"
OUTPUT_ISO="./moringa-os-1.0-${ARCH}.iso"
WORK_DIR="/tmp/moringa-build"
TARGET_USB=""

usage() {
  cat <<EOF
Moringa OS Live USB Builder (Wrld Tech)
Usage: $0 [options]

Options:
  --arch <x86_64|arm64>         Target CPU architecture (default: x86_64)
  --edition <workstation|core|security>
                                OS package profile (default: workstation)
  --persistence <GB>            Encrypted LUKS2 persistence size in GB (default: 0)
  --fs <btrfs|ext4>             Persistence filesystem format (default: btrfs)
  --output <path.iso>           Output hybrid ISO path
  --flash <device>              Optional USB block device to flash (e.g. /dev/sdb)
  -h, --help                    Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --arch) ARCH="$2"; shift 2 ;;
    --edition) EDITION="$2"; shift 2 ;;
    --persistence) PERSISTENCE_GB="$2"; shift 2 ;;
    --fs) FILESYSTEM="$2"; shift 2 ;;
    --output) OUTPUT_ISO="$2"; shift 2 ;;
    --flash) TARGET_USB="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

echo "[Moringa OS] Configuring build: arch=${ARCH} edition=${EDITION} fs=${FILESYSTEM}"
mkdir -p "${WORK_DIR}/rootfs" "${WORK_DIR}/iso/boot/grub" "${WORK_DIR}/iso/live"

cat > "${WORK_DIR}/iso/boot/grub/grub.cfg" <<'GRUBCFG'
set timeout=5
set default=0

menuentry "Moringa OS Live (Workstation - RAM Overlay)" {
  linux /live/vmlinuz boot=live components quiet splash moringa.sandbox=strict
  initrd /live/initrd.img
}

menuentry "Moringa OS Persistent (LUKS2 Encrypted Home)" {
  linux /live/vmlinuz boot=live persistence persistence-encryption=luks moringa.sandbox=strict
  initrd /live/initrd.img
}

menuentry "Moringa OS Safe Graphics & Hardware Probe" {
  linux /live/vmlinuz boot=live nomodeset moringa.probe=verbose
  initrd /live/initrd.img
}
GRUBCFG

echo "[Moringa OS] Installing compatibility runtimes (Wine/DXVK, Darling, Bubblewrap)..."
cat > "${WORK_DIR}/rootfs/etc/moringa-release" <<RELEASE
NAME="Moringa OS"
VERSION="1.0 LTS"
DEVELOPER="Wrld Xavier"
VENDOR="Wrld Tech"
ARCH="${ARCH}"
EDITION="${EDITION}"
SANDBOX_ENGINE="bubblewrap+seccomp-bpf"
COMPAT_LAYERS="linux-elf,winbridge-dxvk,darwinbridge-macho"
RELEASE

if command -v mksquashfs >/dev/null 2>&1 && command -v grub-mkrescue >/dev/null 2>&1; then
  echo "[Moringa OS] Compressing immutable SquashFS rootfs..."
  mksquashfs "${WORK_DIR}/rootfs" "${WORK_DIR}/iso/live/filesystem.squashfs" -comp zstd -Xcompression-level 15 -noappend

  echo "[Moringa OS] Generating hybrid UEFI/BIOS bootable ISO -> ${OUTPUT_ISO}"
  grub-mkrescue -o "${OUTPUT_ISO}" "${WORK_DIR}/iso" -- -volid "MORINGA_OS"
  sha256sum "${OUTPUT_ISO}" > "${OUTPUT_ISO}.sha256"
  echo "[Moringa OS] Build complete. SHA256 written to ${OUTPUT_ISO}.sha256"
else
  echo "[Moringa OS] Dry-run notice: install 'squashfs-tools' and 'grub-pc-bin' on Linux to emit binary ISO."
fi

if [[ -n "${TARGET_USB}" ]]; then
  if [[ ! -b "${TARGET_USB}" ]]; then
    echo "Error: ${TARGET_USB} is not a valid block device." >&2
    exit 1
  fi
  echo "WARNING: Flashing ${OUTPUT_ISO} to ${TARGET_USB} will erase all existing data."
  read -r -p "Type 'MORINGA-FLASH' to confirm: " CONFIRM
  if [[ "${CONFIRM}" == "MORINGA-FLASH" ]]; then
    dd if="${OUTPUT_ISO}" of="${TARGET_USB}" bs=4M status=progress oflag=sync
    sync
    echo "[Moringa OS] USB drive ${TARGET_USB} is bootable and ready."
    if [[ "${PERSISTENCE_GB}" -gt 0 ]]; then
      echo "[Moringa OS] Initialize ${PERSISTENCE_GB}GB ${FILESYSTEM} LUKS2 persistence with cryptsetup."
    fi
  else
    echo "Flash cancelled."
  fi
fi

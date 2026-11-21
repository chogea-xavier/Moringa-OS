/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  Command,
  Layers,
  Monitor,
  Shield,
  Terminal,
  Usb,
} from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
import { CompatibilityHub } from './components/CompatibilityHub';
import { DocsViewer } from './components/DocsViewer';
import { SandboxStudio } from './components/SandboxStudio';
import { SystemMonitor } from './components/SystemMonitor';
import { SystemOverview } from './components/SystemOverview';
import { TerminalShell } from './components/TerminalShell';
import { UsbBuilder } from './components/UsbBuilder';
import {
  DeviceProfileId,
  InputMode,
  OsView,
  ThemeMode,
} from './types/os';

const NAV_ITEMS: Array<{ id: OsView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'monitor', label: 'System Monitor' },
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'sandbox', label: 'Sandbox' },
  { id: 'usb', label: 'USB Builder' },
];

export default function App() {
  const [activeView, setActiveView] = useState<OsView>('overview');
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfileId>('workstation');
  const [inputMode, setInputMode] = useState<InputMode>('keyboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sandboxPayload, setSandboxPayload] = useState<{ code: string; label: string } | null>(
    null
  );
  const [terminalCmd, setTerminalCmd] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      if (e.altKey) {
        const viewMap: Record<string, OsView> = {
          '1': 'overview',
          '2': 'monitor',
          '3': 'compatibility',
          '4': 'sandbox',
          '5': 'usb',
          '6': 'terminal',
          '7': 'docs',
        };
        if (viewMap[e.key]) {
          e.preventDefault();
          setActiveView(viewMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLaunchInSandbox = (code: string, label: string) => {
    setSandboxPayload({ code, label });
    setActiveView('sandbox');
  };

  const handleOpenTerminalCommand = (cmd: string) => {
    setTerminalCmd(cmd);
    setActiveView('terminal');
  };

  const isTouch = inputMode === 'touch';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B1117] dark:text-slate-100 transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B1117]/95 backdrop-blur-sm">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 rounded"
          >
            Moringa OS
          </a>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Primary OS Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    active
                      ? 'border-emerald-600 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'terminal' ? 'overview' : 'terminal')}
              className={`inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-medium px-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isTouch ? 'min-h-[44px]' : 'min-h-[36px]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{activeView === 'terminal' ? 'Exit Shell' : 'Open Terminal'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main OS Viewport */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
        {activeView === 'overview' && (
          <SystemOverview
            deviceProfile={deviceProfile}
            onDeviceProfileChange={setDeviceProfile}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'monitor' && (
          <SystemMonitor
            deviceProfile={deviceProfile}
            inputMode={inputMode}
            onOpenTerminalCommand={handleOpenTerminalCommand}
            onLaunchInSandbox={handleLaunchInSandbox}
          />
        )}

        {activeView === 'compatibility' && (
          <CompatibilityHub
            inputMode={inputMode}
            onLaunchInSandbox={handleLaunchInSandbox}
          />
        )}

        {activeView === 'sandbox' && (
          <SandboxStudio inputMode={inputMode} injectedPayload={sandboxPayload} />
        )}

        {activeView === 'usb' && <UsbBuilder inputMode={inputMode} />}

        {activeView === 'terminal' && (
          <TerminalShell
            deviceProfile={deviceProfile}
            inputMode={inputMode}
            initialCommand={terminalCmd}
            onInitialCommandConsumed={() => setTerminalCmd(null)}
          />
        )}

        {activeView === 'docs' && <DocsViewer inputMode={inputMode} />}
      </main>

      {/* Mobile / Touch Adaptive Bottom Dock (compact <= 15% mobile height) */}
      <nav
        aria-label="Touch and Mobile Navigation Dock"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1117]/95 backdrop-blur-sm px-2 py-1.5"
      >
        <div className="grid grid-cols-6 gap-1">
          {[
            { id: 'overview' as OsView, label: 'Home', Icon: Monitor },
            { id: 'monitor' as OsView, label: 'Monitor', Icon: Activity },
            { id: 'compatibility' as OsView, label: 'Apps', Icon: Layers },
            { id: 'sandbox' as OsView, label: 'Sandbox', Icon: Shield },
            { id: 'usb' as OsView, label: 'USB', Icon: Usb },
            { id: 'terminal' as OsView, label: 'Shell', Icon: Terminal },
          ].map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                className={`min-h-[44px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quiet Attribution Footer */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800/80 py-6">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Moringa OS · Developed by{' '}
            <span className="text-slate-700 dark:text-slate-200 font-medium">Wrld Xavier</span> ·{' '}
            <span className="text-slate-700 dark:text-slate-200 font-medium">Wrld Tech</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Command className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Command Launcher (Ctrl+K)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('docs')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              GitHub README
            </button>
          </div>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveView}
        onDeviceProfileChange={setDeviceProfile}
        onInputModeChange={setInputMode}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
      />
    </div>
  );
}

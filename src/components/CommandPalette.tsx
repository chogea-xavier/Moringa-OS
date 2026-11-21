import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import {
  DeviceProfileId,
  InputMode,
  OsView,
  ThemeMode,
} from '../types/os';

interface CommandAction {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: OsView) => void;
  onDeviceProfileChange: (profile: DeviceProfileId) => void;
  onInputModeChange: (mode: InputMode) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (theme: ThemeMode) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onNavigate,
  onDeviceProfileChange,
  onInputModeChange,
  themeMode,
  onThemeModeChange,
}) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const actions: CommandAction[] = useMemo(
    () => [
      { id: 'nav-overview', label: 'Open System Overview', category: 'Navigation', shortcut: '1', run: () => onNavigate('overview') },
      { id: 'nav-monitor', label: 'Open System Monitor (CPU, Docker, K8s, Hardening)', category: 'Navigation', shortcut: '2', run: () => onNavigate('monitor') },
      { id: 'nav-compat', label: 'Open Cross-Platform Compatibility', category: 'Navigation', shortcut: '3', run: () => onNavigate('compatibility') },
      { id: 'nav-sandbox', label: 'Open Virtualized Sandbox', category: 'Navigation', shortcut: '4', run: () => onNavigate('sandbox') },
      { id: 'nav-usb', label: 'Open Bootable USB Builder', category: 'Navigation', shortcut: '5', run: () => onNavigate('usb') },
      { id: 'nav-term', label: 'Open Moringa Terminal Shell', category: 'Navigation', shortcut: '6', run: () => onNavigate('terminal') },
      { id: 'nav-docs', label: 'Open GitHub README Documentation', category: 'Navigation', shortcut: '7', run: () => onNavigate('docs') },
      { id: 'dev-desktop', label: 'Switch Hardware Profile: Desktop', category: 'Device', run: () => onDeviceProfileChange('desktop') },
      { id: 'dev-laptop', label: 'Switch Hardware Profile: Laptop', category: 'Device', run: () => onDeviceProfileChange('laptop') },
      { id: 'dev-workstation', label: 'Switch Hardware Profile: Workstation', category: 'Device', run: () => onDeviceProfileChange('workstation') },
      { id: 'in-keyboard', label: 'Set Input Ergonomics: Keyboard Mode', category: 'Input', run: () => onInputModeChange('keyboard') },
      { id: 'in-touch', label: 'Set Input Ergonomics: Touch Mode (44px+)', category: 'Input', run: () => onInputModeChange('touch') },
      {
        id: 'theme-toggle',
        label: `Switch Appearance to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`,
        category: 'Appearance',
        run: () => onThemeModeChange(themeMode === 'dark' ? 'light' : 'dark'),
      },
    ],
    [onNavigate, onDeviceProfileChange, onInputModeChange, themeMode, onThemeModeChange]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [actions, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  if (!open) return null;

  const execute = (action: CommandAction) => {
    action.run();
    setQuery('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Moringa OS Command Launcher"
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && filtered[activeIdx]) {
                e.preventDefault();
                execute(filtered[activeIdx]);
              }
            }}
            placeholder="Jump to view, device profile, or OS setting..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              No matching OS actions found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => execute(item)}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-4 text-sm transition-colors ${
                  idx === activeIdx
                    ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{item.category}</span>
                  <span className="truncate font-medium">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className="font-mono text-[11px] text-slate-400 shrink-0">
                    Alt+{item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

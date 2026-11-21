import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
} from 'lucide-react';
import { README_CONTENT } from '../data/osCatalog';
import { InputMode } from '../types/os';

interface DocsViewerProps {
  inputMode: InputMode;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ inputMode }) => {
  const [copied, setCopied] = useState(false);
  const isTouch = inputMode === 'touch';
  const controlHeight = isTouch ? 'min-h-[44px]' : 'min-h-[36px]';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(README_CONTENT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback skipped
    }
  };

  const handleDownload = () => {
    const blob = new Blob([README_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            GitHub Repository Documentation · Wrld Xavier · Wrld Tech
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            README.md
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span>Copied Markdown</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy README.md</span>
              </>
            )}
          </button>

          <a
            href="/bootstrap-moringa-os.sh"
            download="bootstrap-moringa-os.sh"
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Full Repo Script (.sh)</span>
          </a>

          <button
            type="button"
            onClick={handleDownload}
            className={`inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${controlHeight}`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download README.md</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111922] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span className="font-mono">README.md</span>
          <span aria-hidden="true">·</span>
          <span>Also saved at project root for direct GitHub push</span>
        </div>
        <pre className="p-6 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
          {README_CONTENT}
        </pre>
      </div>
    </div>
  );
};

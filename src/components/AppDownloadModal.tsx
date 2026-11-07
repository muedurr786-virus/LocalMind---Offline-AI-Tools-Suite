import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Globe,
  FileCode,
  Share2,
  X,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { generatePortableHtmlApp } from '../lib/portableAppGenerator';
import { generateProjectZip, downloadBlob } from '../lib/zipExporter';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-pre-m5knmqayk7ftveb6idtbzr-765538868958.asia-northeast1.run.app',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'link' | 'portable' | 'zip'>('link');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInstallPWA = async () => {
    const success = await install();
    if (success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleDownloadPortable = () => {
    const blob = generatePortableHtmlApp();
    downloadBlob(blob, 'LocalMind-Portable-App.html');
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await generateProjectZip();
      downloadBlob(zipBlob, 'offline-ai-tools-localmind.zip');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } finally {
      setIsZipping(false);
    }
  };

  // Generate SVG QR code representing appUrl
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=090d16&color=38bdf8&margin=6`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-4 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">App Download & Installation Center</h2>
              <p className="text-xs text-neutral-400">
                Choose your preferred way to run, install, or export LocalMind offline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Selection Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800/80 bg-neutral-950/30 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'link'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Direct App Link & QR</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install App (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('portable')}
            className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'portable'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Single-File App (.html)</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'zip'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Full Code (.zip)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: DIRECT APP LINK & QR */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Direct Web Application Link</h3>
                <p className="text-neutral-400">
                  Share or bookmark this permanent link to launch the offline AI tools directly in any modern browser:
                </p>
              </div>

              {/* URL Field with 1-click copy */}
              <div className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="bg-transparent text-cyan-300 font-mono text-xs flex-1 px-2 focus:outline-none truncate selection:bg-cyan-500/30"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-semibold rounded-lg transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open App</span>
                </a>
              </div>

              {/* Mobile QR Code Scanner */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-36 bg-neutral-950 border border-neutral-800 rounded-lg p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={qrSvgUrl}
                    alt="App Link QR Code"
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      // Fallback if network blocked
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-xs font-semibold text-white block">Scan to Open & Install on Mobile</span>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Point your iPhone Camera or Android QR scanner to instantly open the app on your phone.
                    Once loaded, it caches all assets for complete offline usage.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                      iOS 14+
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                      Android 10+
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                      Chromium & Safari
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA APP INSTALLATION */}
          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Progressive Web App (Native Desktop & Mobile Install)
                </h3>
                <p className="text-neutral-400">
                  Install LocalMind as a standalone desktop or mobile application. It appears on your Home Screen or Dock with a dedicated window and zero browser address bars.
                </p>
              </div>

              {/* Status & Primary Install Action */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200 block text-xs">PWA Status:</span>
                    <span className="text-neutral-400 text-[11px]">
                      {isInstalled
                        ? 'Installed & Running in Standalone Window'
                        : isInstallable
                        ? 'Ready for 1-Click Native Installation'
                        : 'Web App Manifest & Service Worker Registered'}
                    </span>
                  </div>

                  {isInstallable && !isInstalled && (
                    <button
                      onClick={handleInstallPWA}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions by Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>Chrome / Edge Desktop</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    1. Click the <strong>Install</strong> icon in the right side of the browser address bar.<br />
                    2. Click <strong>Install LocalMind</strong>.<br />
                    3. Launch anytime from your Start Menu, Applications, or Desktop icon.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>iPhone & iPad (iOS Safari)</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    1. Tap the <strong>Share</strong> button (box with upward arrow).<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                    3. Tap <strong>Add</strong> to pin the LocalMind icon to your home screen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTABLE SINGLE-FILE HTML APP */}
          {activeTab === 'portable' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Download Standalone Single-File App (`.html`)
                </h3>
                <p className="text-neutral-400">
                  A self-contained, 100% offline HTML file bundling the complete neural network, summarizer, sentiment analyzer, vision filters, and audio synthesizer.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">LocalMind-Portable-App.html</span>
                    <span className="text-neutral-500 text-[11px]">Self-contained · Single file · ~25 KB</span>
                  </div>

                  <button
                    onClick={handleDownloadPortable}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Single-File App</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-800 text-neutral-400 text-[11px] space-y-1">
                  <p className="text-white font-medium">Why use the single-file app?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>No Node.js, npm, or dev server required.</li>
                    <li>Double-click to open in Chrome, Firefox, Safari, Edge, or Brave.</li>
                    <li>Save to a USB drive or air-gapped terminal for field use.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FULL CODE ARCHIVE (.ZIP) */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Full Source Code Repository (`.zip`)
                </h3>
                <p className="text-neutral-400">
                  Download the complete Vite + React 19 + TypeScript project with all algorithms, modules, and documentation.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">offline-ai-tools-localmind.zip</span>
                  <span className="text-neutral-500 text-[11px]">
                    Complete TypeScript & React Source Code Bundle
                  </span>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-neutral-950 font-bold rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isZipping ? 'Creating ZIP...' : 'Download Code ZIP'}</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg text-neutral-400 font-mono text-[11px]">
                <span className="text-neutral-500"># Terminal quickstart:</span><br />
                <span className="text-cyan-300">unzip offline-ai-tools-localmind.zip</span><br />
                <span className="text-cyan-300">cd offline-ai-tools-localmind</span><br />
                <span className="text-cyan-300">npm install && npm run dev</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Zero Server Storage · 100% In-Device Memory</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NeuralNetView } from './components/NeuralNetView';
import { SummarizerView } from './components/SummarizerView';
import { SentimentView } from './components/SentimentView';
import { VisionOcrView } from './components/VisionOcrView';
import { VectorSearchView } from './components/VectorSearchView';
import { AudioStudioView } from './components/AudioStudioView';
import { CodeZipModal } from './components/CodeZipModal';
import { AppDownloadModal } from './components/AppDownloadModal';
import { ToolTab } from './types';
import { ShieldCheck, Download, Smartphone, Globe, Laptop, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolTab>('neural');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTabChange = (tab: ToolTab) => {
    if (tab === 'code') {
      setIsCodeModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenCodeZip={() => setIsCodeModalOpen(true)}
        onOpenAppDownload={() => setIsAppModalOpen(true)}
      />

      {/* App Download Link & Offline Bar */}
      <div className="bg-neutral-900/90 border-b border-neutral-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-cyan-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Install & Run Offline:</span>
          </span>
          <span className="text-neutral-300 hidden md:inline">
            Direct web app link, PWA desktop/mobile install, and standalone single-file (.html) available.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-md transition-colors font-medium"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Get App Download Links</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="flex-1 pb-16">
        {activeTab === 'neural' && <NeuralNetView />}
        {activeTab === 'summarizer' && <SummarizerView />}
        {activeTab === 'sentiment' && <SentimentView />}
        {activeTab === 'vision' && <VisionOcrView />}
        {activeTab === 'vector' && <VectorSearchView />}
        {activeTab === 'audio' && <AudioStudioView />}
      </main>

      {/* Persistent Bottom Status Strip */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur py-3 px-6 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Remote Telemetry · 100% In-Device Memory</span>
          </span>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <span className="text-neutral-400 hidden sm:inline">
            {isOffline ? 'Currently Offline (All Tools Active)' : 'Network Connected'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAppModalOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Download Links & PWA</span>
          </button>
          <span className="text-neutral-700">·</span>
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Full Code (.zip)</span>
          </button>
        </div>
      </footer>

      {/* App Download Center Modal */}
      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
      />

      {/* Source Code & ZIP Exporter Modal */}
      <CodeZipModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}

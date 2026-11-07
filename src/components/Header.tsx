import React from 'react';
import { Download, Code2, Cpu, FileText, HeartHandshake, Eye, Database, Volume2, Smartphone } from 'lucide-react';
import { ToolTab } from '../types';

interface HeaderProps {
  activeTab: ToolTab;
  onTabChange: (tab: ToolTab) => void;
  onOpenCodeZip: () => void;
  onOpenAppDownload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCodeZip,
  onOpenAppDownload,
}) => {
  const tabs: { id: ToolTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'neural', label: 'Neural Lab', icon: Cpu },
    { id: 'summarizer', label: 'Summarizer', icon: FileText },
    { id: 'sentiment', label: 'Sentiment', icon: HeartHandshake },
    { id: 'vision', label: 'Vision OCR', icon: Eye },
    { id: 'vector', label: 'Vector Search', icon: Database },
    { id: 'audio', label: 'Audio Studio', icon: Volume2 },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('neural');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap"
        >
          LocalMind
        </a>
        <span className="text-xs text-neutral-400 font-mono tracking-tight hidden sm:inline">
          · 100% Offline AI
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions (Download App & Code ZIP) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAppDownload}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950/50"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Download App</span>
        </button>

        <button
          onClick={onOpenCodeZip}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span>Code (.zip)</span>
        </button>

        <button
          onClick={() => onTabChange('code')}
          title="Browse Source Files"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
      </div>
    </header>
  );
};

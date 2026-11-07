import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Folder, X, Terminal, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateProjectZip, downloadBlob } from '../lib/zipExporter';
import { PROJECT_FILES } from '../lib/projectSourceFiles';

interface CodeZipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeZipModal: React.FC<CodeZipModalProps> = ({ isOpen, onClose }) => {
  const fileKeys = Object.keys(PROJECT_FILES);
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsExporting(true);
    setProgress(0);
    setProgressStatus('Packaging project files...');

    try {
      const zipBlob = await generateProjectZip((pct, status) => {
        setProgress(pct);
        setProgressStatus(status);
      });

      downloadBlob(zipBlob, 'offline-ai-tools-localmind.zip');

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setProgress(100);
      setProgressStatus('Download Complete!');
      setTimeout(() => {
        setIsExporting(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to create ZIP', err);
      setIsExporting(false);
    }
  };

  const handleCopyCode = () => {
    const content = PROJECT_FILES[selectedFile] || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent = PROJECT_FILES[selectedFile] || '';
  const lines = currentContent.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Full Source Code & ZIP Exporter</h2>
              <p className="text-xs text-neutral-400">
                Download the complete codebase to run 100% offline on your local machine with Node.js & Vite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950/60"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating ZIP...' : 'Download Project ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar banner during export */}
        {isExporting && (
          <div className="bg-neutral-950 px-6 py-2 border-b border-neutral-800 space-y-1">
            <div className="flex justify-between text-xs text-neutral-300">
              <span className="font-mono">{progressStatus}</span>
              <span className="font-mono tabular-nums text-cyan-400">{progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Terminal Run Instructions Strip */}
        <div className="bg-neutral-950/80 px-6 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono overflow-x-auto">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-300">To run locally:</span>
            <span className="text-cyan-400">unzip offline-ai-tools.zip && cd offline-ai-tools && npm install && npm run dev</span>
          </div>
        </div>

        {/* Code Viewport: Left Sidebar (File Tree) + Right Code Viewer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left: File Tree */}
          <div className="md:col-span-4 border-r border-neutral-800 bg-neutral-950/50 p-4 space-y-1 overflow-y-auto">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block px-2 mb-2">
              Project Structure ({fileKeys.length} files)
            </span>

            {fileKeys.map((file) => {
              const isSelected = selectedFile === file;
              return (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                    isSelected
                      ? 'bg-neutral-800 text-cyan-400 font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{file}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Code Viewer */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-neutral-950">
            {/* Viewer Header */}
            <div className="px-4 py-2 border-b border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="font-mono text-neutral-300">{selectedFile}</span>

              <div className="flex items-center gap-3">
                <span className="text-neutral-500 font-mono text-[11px]">
                  {lines.length} lines · {Math.round(currentContent.length / 1024 * 10) / 10} KB
                </span>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-800 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed scrollbar-thin">
              <pre className="flex">
                {/* Line Numbers */}
                <div className="select-none text-neutral-600 pr-4 text-right border-r border-neutral-800/60 mr-4 shrink-0">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Actual Code */}
                <code className="text-neutral-200 whitespace-pre">{currentContent}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

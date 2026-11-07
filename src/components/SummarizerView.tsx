import React, { useState, useMemo } from 'react';
import { Copy, Download, Check, Sparkles, Clock, FileDown, RefreshCw } from 'lucide-react';
import { summarizeText, SAMPLE_TEXTS } from '../engines/textSummarizer';

export const SummarizerView: React.FC = () => {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS.ai_privacy);
  const [compressionRatio, setCompressionRatio] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    return summarizeText(inputText, compressionRatio);
  }, [inputText, compressionRatio]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localmind-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Extractive Text Summarizer</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Offline TextRank graph algorithm with TF-IDF and position weighting. Zero hallucination, 100% on-device.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <span className="text-xs text-neutral-500 pl-2 pr-1">Presets:</span>
          <button
            onClick={() => setInputText(SAMPLE_TEXTS.ai_privacy)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            AI Privacy
          </button>
          <button
            onClick={() => setInputText(SAMPLE_TEXTS.research_summary)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Neural Net
          </button>
          <button
            onClick={() => setInputText(SAMPLE_TEXTS.terms_agreement)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Offline Terms
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500 block">Original Length</span>
          <span className="text-xl font-bold font-mono tabular-nums text-white mt-1 block">
            {result.originalWords} words
          </span>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500 block">Summary Length</span>
          <span className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-1 block">
            {result.summaryWords} words
          </span>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500 block">Compression Ratio</span>
          <span className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1 block">
            {Math.round(result.compressionRatio * 100)}%
          </span>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-500 block">Reading Time Saved</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1 block">
            ~{result.readingTimeSavedSec}s
          </span>
        </div>
      </div>

      {/* Editor & Summary Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Source Text */}
        <div className="lg:col-span-6 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">Source Document</span>
            <button
              onClick={() => setInputText('')}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Clear Text
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your article, meeting transcript, research paper, or essay here..."
            rows={14}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
          />

          {/* Slider for target compression */}
          <div className="pt-2 border-t border-neutral-800/80">
            <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
              <span>Target Summary Length</span>
              <span className="font-mono tabular-nums text-cyan-400 font-medium">
                {compressionRatio}% of original
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={compressionRatio}
              onChange={(e) => setCompressionRatio(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Output Summary & Key Insights */}
        <div className="lg:col-span-6 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">Synthesized Summary</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <span className="text-neutral-700">·</span>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-200 leading-relaxed overflow-y-auto max-h-[340px]">
            {result.summary ? (
              <p className="whitespace-pre-line">{result.summary}</p>
            ) : (
              <p className="text-neutral-600 italic">Enter source text to generate extractive summary...</p>
            )}
          </div>

          {/* Key Sentences / Critical Points */}
          {result.keySentences.length > 0 && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">Top Key Takeaways</span>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {result.keySentences.slice(0, 3).map((sent, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">0{idx + 1}.</span>
                    <span className="line-clamp-2">{sent}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords */}
          {result.topKeywords.length > 0 && (
            <div className="pt-2 border-t border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1.5">Dominant Semantic Keywords:</span>
              <div className="flex flex-wrap gap-1.5 text-xs text-neutral-400">
                {result.topKeywords.map((k) => (
                  <span key={k.word} className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded font-mono text-[11px]">
                    {k.word} <span className="text-neutral-600">({k.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { analyzeSentiment } from '../engines/sentimentAnalyzer';
import { Sparkles, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';

const SAMPLE_SENTIMENTS = {
  customer_review: `The new offline architecture is exceptionally fast and reliable! We love how secure and private our customer records remain. There were a couple of minor setup steps that felt slightly slow, but the breakthrough in performance and zero recurring server costs make this an outstanding triumph. Highly recommended!`,
  
  support_escalation: `Warning: The database connection failed during the nightly migration, causing significant delay and severe frustration for the engineering team. This is a critical issue that must be addressed immediately before our client demo tomorrow morning. Please treat this with utmost urgency.`,

  balanced_report: `The quarterly experimental benchmark demonstrated solid progress across multiple vector index models. While memory consumption remains somewhat high for larger datasets, inference speed is predictable and stable. With targeted optimization, this technology should deliver valuable advantages.`,
};

export const SentimentView: React.FC = () => {
  const [text, setText] = useState<string>(SAMPLE_SENTIMENTS.customer_review);

  const result = useMemo(() => {
    return analyzeSentiment(text);
  }, [text]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Sentiment & Tone Analyzer</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Lexicon-based valence and emotion engine with negation, intensifiers, and sentence trajectory modeling.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <span className="text-xs text-neutral-500 pl-2 pr-1">Presets:</span>
          <button
            onClick={() => setText(SAMPLE_SENTIMENTS.customer_review)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Positive Review
          </button>
          <button
            onClick={() => setText(SAMPLE_SENTIMENTS.support_escalation)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Urgent Escalation
          </button>
          <button
            onClick={() => setText(SAMPLE_SENTIMENTS.balanced_report)}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Analytical Report
          </button>
        </div>
      </div>

      {/* Primary Score & Emotional Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overall Sentiment Dial & Emotion Metrics */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Polarity Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-semibold text-neutral-300 block">Overall Valence</span>

            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`text-3xl font-extrabold font-mono tabular-nums ${
                    result.score > 0.1
                      ? 'text-emerald-400'
                      : result.score < -0.1
                      ? 'text-rose-400'
                      : 'text-neutral-300'
                  }`}
                >
                  {result.score > 0 ? `+${result.score.toFixed(2)}` : result.score.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-400 block mt-0.5 capitalize">
                  {result.classification} tone · {(result.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              {/* Gauge Indicator */}
              <div className="w-28 h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    result.score > 0.1 ? 'bg-emerald-500' : result.score < -0.1 ? 'bg-rose-500' : 'bg-neutral-500'
                  }`}
                  style={{
                    width: `${Math.max(5, Math.abs(result.score) * 100)}%`,
                    marginLeft: result.score >= 0 ? '50%' : `${Math.max(0, 50 - Math.abs(result.score) * 50)}%`,
                  }}
                />
              </div>
            </div>

            {/* Emotional Distribution */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-2.5 text-xs">
              <span className="text-neutral-400 font-medium block">Emotional Profile:</span>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Delight / Joy</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {(result.emotions.joy * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all" style={{ width: `${result.emotions.joy * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Confidence & Trust</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {(result.emotions.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all" style={{ width: `${result.emotions.confidence * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Urgency</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {(result.emotions.urgency * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${result.emotions.urgency * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Caution / Risk</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {(result.emotions.caution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 transition-all" style={{ width: `${result.emotions.caution * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Frustration / Dissatisfaction</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {(result.emotions.frustration * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 transition-all" style={{ width: `${result.emotions.frustration * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lexical Highlights */}
          {result.wordHighlights.length > 0 && (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">Identified Emotional Lexicon</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {result.wordHighlights.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded border text-[11px] font-mono ${
                      item.score > 0
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                        : item.score < 0
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {item.word} ({item.score > 0 ? `+${item.score}` : item.score})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Text Input & Sentence Progression Trajectory */}
        <div className="lg:col-span-7 space-y-5">
          {/* Text Editor */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">Input Text</span>
              <span className="font-mono tabular-nums text-neutral-500">
                {text.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste any text to analyze sentiment..."
              rows={6}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Sentence-by-Sentence Trajectory */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-semibold text-neutral-200 block">
              Sentence-by-Sentence Narrative Trajectory
            </span>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {result.sentenceBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="text-neutral-500 font-mono block">Sentence {idx + 1}</span>
                    <p className="text-neutral-300 leading-relaxed">{item.sentence}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold tabular-nums block ${
                        item.score > 0.1
                          ? 'text-emerald-400'
                          : item.score < -0.1
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-neutral-500 capitalize">{item.classification}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

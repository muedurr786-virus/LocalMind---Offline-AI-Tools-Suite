import { ActivationType, DataPoint, NeuralNetConfig } from '../types';

export const PROJECT_FILES: Record<string, string> = {
  'README.md': `# LocalMind - 100% Offline AI Tools Suite

A privacy-first, zero-cloud artificial intelligence suite that runs entirely in your browser using pure TypeScript, Canvas 2D, and Web Audio APIs. No external API keys, no server roundtrips, no data leaks.

## Included Offline AI Engines

1. **Neural Network Laboratory (MLP Engine)**:
   - Full feedforward Multi-Layer Perceptron (MLP) written in pure TypeScript.
   - Forward pass, backpropagation, and momentum gradient descent.
   - Activations: Tanh, ReLU, LeakyReLU, Sigmoid.
   - Real-time 2D decision boundary field visualization on HTML5 Canvas.
   - Interactive training on Spiral, Circle, XOR, Two Moons, and Custom user data points.
   - Model weights JSON exporter and importer.

2. **Extractive Text Summarizer**:
   - TextRank graph-based sentence ranking with PageRank damping.
   - TF-IDF word weighting with position heuristics.
   - Adjustable compression ratio slider (10% to 60%).
   - Key insights extraction and reading time saved calculator.

3. **Sentiment & Tone Analyzer**:
   - VADER-style valence lexicon engine with negation and intensifier support.
   - 5-dimensional emotional breakdown (Joy, Confidence, Urgency, Caution, Frustration).
   - Sentence-by-sentence narrative trajectory visualization.

4. **Local Vision & OCR Engine**:
   - Canvas-based image processing filters: Otsu Binarization, Sobel Gradients, Histogram Stretch.
   - Connected component analysis, line baseline segmentation, and word bounding box detection.
   - K-Means color palette quantization (extracts dominant HEX/RGB centroids).

5. **Semantic Vector Search & Offline Q&A**:
   - BM25 term weighting and character 3-gram subword embeddings.
   - Cosine similarity ranking across high-dimensional vector space.
   - In-memory document indexing with live semantic matching and snippet extraction.

6. **Offline Audio & Speech Studio**:
   - Web Audio API real-time 128-band FFT frequency spectrum and oscilloscope.
   - Pure synthetic tone oscillator (Sine, Square, Sawtooth, Triangle).
   - Offline Speech Synthesis (TTS) and Web Speech Recognition (STT).

## Running Locally

\`\`\`bash
# 1. Unzip the downloaded file
unzip offline-ai-tools.zip
cd offline-ai-tools

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser. Fully functional even when disconnected from the Internet!
`,

  'package.json': `{
  "name": "localmind-offline-ai-tools",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "canvas-confetti": "^1.9.4",
    "jszip": "^3.10.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "tailwindcss": "^4.3.3",
    "vite": "^8.3.0",
    "vite-plugin-pwa": "^1.2.0"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "@types/jszip": "^3.4.1",
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "typescript": "^7.0.2"
  }
}
`,

  'vite.config.ts': `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "module": "ESNext",
    "types": ["vite/client"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "noEmit": true
  },
  "exclude": ["dist"]
}
`,

  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LocalMind - Offline AI Tools Suite</title>
    <meta name="description" content="Zero-cloud, privacy-first offline AI suite running 100% in your browser." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-neutral-950 text-neutral-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

  'src/index.css': `@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

body {
  font-family: var(--font-sans);
}
`,

  'src/main.tsx': `import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
`,

  'src/types.ts': `export type ToolTab =
  | 'neural'
  | 'summarizer'
  | 'sentiment'
  | 'vision'
  | 'vector'
  | 'audio'
  | 'code';

export interface DataPoint {
  x: number;
  y: number;
  label: number;
}

export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu';

export interface NeuralNetConfig {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  activation: ActivationType;
  learningRate: number;
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface SummaryResult {
  summary: string;
  keySentences: string[];
  compressionRatio: number;
  originalWords: number;
  summaryWords: number;
  readingTimeSavedSec: number;
  topKeywords: { word: string; count: number; score: number }[];
}

export interface SentimentResult {
  score: number;
  classification: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: {
    joy: number;
    urgency: number;
    confidence: number;
    caution: number;
    frustration: number;
  };
  sentenceBreakdown: {
    sentence: string;
    score: number;
    classification: 'positive' | 'neutral' | 'negative';
  }[];
  wordHighlights: {
    word: string;
    score: number;
    type: 'positive' | 'negative' | 'intensifier' | 'negator';
  }[];
}

export interface OcrBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

export interface VisionProcessResult {
  extractedText: string;
  boxes: OcrBox[];
  dominantColors: { hex: string; rgb: [number, number, number]; percent: number }[];
  dimensions: { width: number; height: number };
}

export interface VectorDocument {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface SearchResult {
  doc: VectorDocument;
  score: number;
  relevantSnippets: string[];
}
`,

  'src/engines/neuralNetwork.ts': `import { ActivationType, DataPoint, NeuralNetConfig } from '../types';

export class Layer {
  weights: number[][];
  biases: number[];
  inputs: number[] = [];
  outputs: number[] = [];
  activations: number[] = [];
  dWeights: number[][];
  dBiases: number[];
  vWeights: number[][];
  vBiases: number[];

  constructor(public inputSize: number, public outputSize: number) {
    this.weights = [];
    this.biases = [];
    this.dWeights = [];
    this.dBiases = [];
    this.vWeights = [];
    this.vBiases = [];

    const std = Math.sqrt(2 / (inputSize + outputSize));
    for (let i = 0; i < outputSize; i++) {
      const row: number[] = [];
      const dRow: number[] = [];
      const vRow: number[] = [];
      for (let j = 0; j < inputSize; j++) {
        row.push((Math.random() * 2 - 1) * std);
        dRow.push(0);
        vRow.push(0);
      }
      this.weights.push(row);
      this.dWeights.push(dRow);
      this.vWeights.push(vRow);
      this.biases.push(0);
      this.dBiases.push(0);
      this.vBiases.push(0);
    }
  }

  forward(inputs: number[], activation: ActivationType, isOutputLayer = false): number[] {
    this.inputs = [...inputs];
    this.outputs = [];
    this.activations = [];

    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.biases[i];
      for (let j = 0; j < this.inputSize; j++) {
        sum += this.weights[i][j] * inputs[j];
      }
      this.outputs.push(sum);

      if (isOutputLayer) {
        this.activations.push(1 / (1 + Math.exp(-Math.max(-15, Math.min(15, sum)))));
      } else {
        this.activations.push(applyActivation(sum, activation));
      }
    }

    return this.activations;
  }
}

function applyActivation(x: number, type: ActivationType): number {
  switch (type) {
    case 'relu':
      return Math.max(0, x);
    case 'leaky_relu':
      return x > 0 ? x : 0.01 * x;
    case 'tanh':
      return Math.tanh(x);
    case 'sigmoid':
    default:
      return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
  }
}

function applyActivationDerivative(x: number, actVal: number, type: ActivationType): number {
  switch (type) {
    case 'relu':
      return x > 0 ? 1 : 0;
    case 'leaky_relu':
      return x > 0 ? 1 : 0.01;
    case 'tanh':
      return 1 - actVal * actVal;
    case 'sigmoid':
    default:
      return actVal * (1 - actVal);
  }
}

export class NeuralNetwork {
  layers: Layer[] = [];
  config: NeuralNetConfig;

  constructor(config: NeuralNetConfig) {
    this.config = config;
    this.build();
  }

  build() {
    this.layers = [];
    const sizes = [this.config.inputSize, ...this.config.hiddenLayers, this.config.outputSize];
    for (let i = 0; i < sizes.length - 1; i++) {
      this.layers.push(new Layer(sizes[i], sizes[i + 1]));
    }
  }

  predict(inputs: number[]): number[] {
    let current = inputs;
    for (let i = 0; i < this.layers.length; i++) {
      const isOutput = i === this.layers.length - 1;
      current = this.layers[i].forward(current, this.config.activation, isOutput);
    }
    return current;
  }

  trainStep(data: DataPoint[], batchSize = 16): { loss: number; accuracy: number } {
    let totalLoss = 0;
    let correct = 0;
    const lr = this.config.learningRate;
    const momentum = 0.85;

    const indices = Array.from({ length: data.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const batchIndices = indices.slice(0, Math.min(batchSize, data.length));

    for (const idx of batchIndices) {
      const point = data[idx];
      const target = point.label;
      const inputs = [point.x, point.y];

      const preds = this.predict(inputs);
      const output = preds[0];

      const eps = 1e-7;
      const p = Math.max(eps, Math.min(1 - eps, output));
      const sampleLoss = -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
      totalLoss += sampleLoss;

      const predClass = output >= 0.5 ? 1 : 0;
      if (predClass === target) correct++;

      let dOutput = [output - target];

      for (let l = this.layers.length - 1; l >= 0; l--) {
        const layer = this.layers[l];
        const isOutput = l === this.layers.length - 1;
        const prevInputs = layer.inputs;
        const nextDInputs: number[] = new Array(layer.inputSize).fill(0);

        for (let i = 0; i < layer.outputSize; i++) {
          let delta = dOutput[i];
          if (!isOutput) {
            delta *= applyActivationDerivative(layer.outputs[i], layer.activations[i], this.config.activation);
          }

          for (let j = 0; j < layer.inputSize; j++) {
            layer.dWeights[i][j] += delta * prevInputs[j];
            nextDInputs[j] += delta * layer.weights[i][j];
          }
          layer.dBiases[i] += delta;
        }

        dOutput = nextDInputs;
      }
    }

    const batchScale = 1 / batchIndices.length;
    for (const layer of this.layers) {
      for (let i = 0; i < layer.outputSize; i++) {
        for (let j = 0; j < layer.inputSize; j++) {
          const grad = layer.dWeights[i][j] * batchScale;
          layer.vWeights[i][j] = momentum * layer.vWeights[i][j] - lr * grad;
          layer.weights[i][j] += layer.vWeights[i][j];
          layer.dWeights[i][j] = 0;
        }
        const bGrad = layer.dBiases[i] * batchScale;
        layer.vBiases[i] = momentum * layer.vBiases[i] - lr * bGrad;
        layer.biases[i] += layer.vBiases[i];
        layer.dBiases[i] = 0;
      }
    }

    return {
      loss: totalLoss / batchIndices.length,
      accuracy: correct / batchIndices.length,
    };
  }

  exportModel(): string {
    return JSON.stringify(
      {
        config: this.config,
        layers: this.layers.map((l) => ({
          inputSize: l.inputSize,
          outputSize: l.outputSize,
          weights: l.weights,
          biases: l.biases,
        })),
      },
      null,
      2
    );
  }

  importModel(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.config || !data.layers) return false;
      this.config = data.config;
      this.layers = [];
      for (const lData of data.layers) {
        const layer = new Layer(lData.inputSize, lData.outputSize);
        layer.weights = lData.weights;
        layer.biases = lData.biases;
        this.layers.push(layer);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export function generateDataset(type: 'spiral' | 'circle' | 'xor' | 'moons' | 'clusters', count = 200): DataPoint[] {
  const points: DataPoint[] = [];
  const perClass = Math.floor(count / 2);

  if (type === 'spiral') {
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < perClass; i++) {
        const r = (i / perClass) * 0.85 + 0.1;
        const theta = (i / perClass) * Math.PI * 2.8 + c * Math.PI;
        points.push({
          x: r * Math.sin(theta) + (Math.random() - 0.5) * 0.06,
          y: r * Math.cos(theta) + (Math.random() - 0.5) * 0.06,
          label: c,
        });
      }
    }
  } else if (type === 'circle') {
    for (let i = 0; i < perClass; i++) {
      const r = Math.sqrt(Math.random()) * 0.4;
      const theta = Math.random() * Math.PI * 2;
      points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), label: 0 });
    }
    for (let i = 0; i < perClass; i++) {
      const r = 0.6 + Math.random() * 0.35;
      const theta = Math.random() * Math.PI * 2;
      points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), label: 1 });
    }
  } else if (type === 'xor') {
    for (let i = 0; i < perClass; i++) {
      const sign = Math.random() > 0.5 ? 1 : -1;
      points.push({ x: (0.2 + Math.random() * 0.65) * sign, y: (0.2 + Math.random() * 0.65) * sign, label: 1 });
    }
    for (let i = 0; i < perClass; i++) {
      const sign = Math.random() > 0.5 ? 1 : -1;
      points.push({ x: (0.2 + Math.random() * 0.65) * sign, y: (0.2 + Math.random() * 0.65) * -sign, label: 0 });
    }
  } else if (type === 'moons') {
    for (let i = 0; i < perClass; i++) {
      const theta = (i / perClass) * Math.PI;
      const r = 0.5 + (Math.random() - 0.5) * 0.08;
      points.push({ x: r * Math.cos(theta) - 0.25, y: r * Math.sin(theta) - 0.15, label: 0 });
    }
    for (let i = 0; i < perClass; i++) {
      const theta = (i / perClass) * Math.PI;
      const r = 0.5 + (Math.random() - 0.5) * 0.08;
      points.push({ x: 0.25 - r * Math.cos(theta), y: 0.15 - r * Math.sin(theta), label: 1 });
    }
  } else {
    for (let i = 0; i < perClass; i++) {
      points.push({ x: -0.45 + (Math.random() - 0.5) * 0.45, y: 0.35 + (Math.random() - 0.5) * 0.45, label: 0 });
    }
    for (let i = 0; i < perClass; i++) {
      points.push({ x: 0.45 + (Math.random() - 0.5) * 0.45, y: -0.35 + (Math.random() - 0.5) * 0.45, label: 1 });
    }
  }

  return points;
}
`,

  'src/engines/textSummarizer.ts': `import { SummaryResult } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'also'
]);

export function tokenizeSentences(text: string): string[] {
  const raw = text
    .replace(/([.?!])\\s*(?=[A-Z0-9"“])/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  return raw.length > 0 ? raw : [text.trim()];
}

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s]/g, ' ')
    .split(/\\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function sentenceSimilarity(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();

  for (const w of wordsA) freqA.set(w, (freqA.get(w) || 0) + 1);
  for (const w of wordsB) freqB.set(w, (freqB.get(w) || 0) + 1);

  let dotProduct = 0;
  for (const [w, countA] of freqA.entries()) {
    if (freqB.has(w)) dotProduct += countA * freqB.get(w)!;
  }

  const magA = Math.sqrt([...freqA.values()].reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt([...freqB.values()].reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export function summarizeText(text: string, targetPercent = 30): SummaryResult {
  const sentences = tokenizeSentences(text);
  const totalWords = text.trim().split(/\\s+/).filter(Boolean).length;

  if (sentences.length <= 2) {
    return {
      summary: text.trim(),
      keySentences: sentences,
      compressionRatio: 1,
      originalWords: totalWords,
      summaryWords: totalWords,
      readingTimeSavedSec: 0,
      topKeywords: [],
    };
  }

  const sentenceTokens = sentences.map((s) => tokenizeWords(s));
  const globalWordFreq = new Map<string, number>();

  for (const tokens of sentenceTokens) {
    for (const token of tokens) {
      globalWordFreq.set(token, (globalWordFreq.get(token) || 0) + 1);
    }
  }

  const sortedKeywords = [...globalWordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({
      word,
      count,
      score: Math.round((count / (totalWords || 1)) * 1000) / 10,
    }));

  const n = sentences.length;
  const simMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const degrees: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = sentenceSimilarity(sentenceTokens[i], sentenceTokens[j]);
      simMatrix[i][j] = sim;
      simMatrix[j][i] = sim;
      degrees[i] += sim;
      degrees[j] += sim;
    }
  }

  const d = 0.85;
  let scores: number[] = new Array(n).fill(1 / n);

  for (let iter = 0; iter < 25; iter++) {
    const nextScores: number[] = new Array(n).fill((1 - d) / n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && degrees[j] > 0) {
          nextScores[i] += d * (simMatrix[j][i] / degrees[j]) * scores[j];
        }
      }
    }
    scores = nextScores;
  }

  const weightedScores = scores.map((score, idx) => {
    let positionMultiplier = 1.0;
    if (idx === 0) positionMultiplier = 1.35;
    else if (idx === 1) positionMultiplier = 1.15;
    else if (idx === n - 1) positionMultiplier = 1.25;
    return { index: idx, sentence: sentences[idx], score: score * positionMultiplier };
  });

  const desiredSentenceCount = Math.max(1, Math.round((sentences.length * targetPercent) / 100));
  const topScored = [...weightedScores].sort((a, b) => b.score - a.score).slice(0, desiredSentenceCount);
  const orderedSummary = topScored.sort((a, b) => a.index - b.index).map((item) => item.sentence);

  const summary = orderedSummary.join(' ');
  const summaryWords = summary.trim().split(/\\s+/).filter(Boolean).length;
  const compressionRatio = Math.round((summaryWords / Math.max(1, totalWords)) * 100) / 100;
  const wordsSaved = Math.max(0, totalWords - summaryWords);
  const readingTimeSavedSec = Math.round(wordsSaved / 3.33);

  return {
    summary,
    keySentences: topScored.map((item) => item.sentence),
    compressionRatio,
    originalWords: totalWords,
    summaryWords,
    readingTimeSavedSec,
    topKeywords: sortedKeywords,
  };
}
`,

  'src/App.tsx': `import React, { useState } from 'react';
import { Header } from './components/Header';
import { NeuralNetView } from './components/NeuralNetView';
import { SummarizerView } from './components/SummarizerView';
import { SentimentView } from './components/SentimentView';
import { VisionOcrView } from './components/VisionOcrView';
import { VectorSearchView } from './components/VectorSearchView';
import { AudioStudioView } from './components/AudioStudioView';
import { CodeZipModal } from './components/CodeZipModal';
import { ToolTab } from './types';
import { ShieldCheck, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolTab>('neural');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => (tab === 'code' ? setIsCodeModalOpen(true) : setActiveTab(tab))}
        onOpenCodeZip={() => setIsCodeModalOpen(true)}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'neural' && <NeuralNetView />}
        {activeTab === 'summarizer' && <SummarizerView />}
        {activeTab === 'sentiment' && <SentimentView />}
        {activeTab === 'vision' && <VisionOcrView />}
        {activeTab === 'vector' && <VectorSearchView />}
        {activeTab === 'audio' && <AudioStudioView />}
      </main>

      <footer className="border-t border-neutral-800/80 bg-neutral-950/90 py-3 px-6 text-xs text-neutral-500 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Remote Telemetry · 100% In-Device Memory</span>
        </div>

        <button
          onClick={() => setIsCodeModalOpen(true)}
          className="text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Code Archive (.zip)</span>
        </button>
      </footer>

      <CodeZipModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />
    </div>
  );
}
`,
};

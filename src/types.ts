export type ToolTab =
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
  label: number; // 0 or 1
}

export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu';

export interface NeuralNetConfig {
  inputSize: number;
  hiddenLayers: number[]; // e.g. [8, 8]
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
  score: number; // -1 to +1
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

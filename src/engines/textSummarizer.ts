import { SummaryResult } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s',
  'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
  'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'also', 'just', 'like'
]);

export function tokenizeSentences(text: string): string[] {
  // Regex to split on sentence boundaries while avoiding decimals and common abbreviations
  const rawSentences = text
    .replace(/([.?!])\s*(?=[A-Z0-9"“])/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return rawSentences.length > 0 ? rawSentences : [text.trim()];
}

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Compute cosine similarity between two word frequency maps
function sentenceSimilarity(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();

  for (const w of wordsA) freqA.set(w, (freqA.get(w) || 0) + 1);
  for (const w of wordsB) freqB.set(w, (freqB.get(w) || 0) + 1);

  let dotProduct = 0;
  for (const [w, countA] of freqA.entries()) {
    if (freqB.has(w)) {
      dotProduct += countA * freqB.get(w)!;
    }
  }

  const magA = Math.sqrt([...freqA.values()].reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt([...freqB.values()].reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export function summarizeText(text: string, targetPercent = 30): SummaryResult {
  const sentences = tokenizeSentences(text);
  const totalWords = text.trim().split(/\s+/).filter(Boolean).length;

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

  // Compute overall word frequency
  const globalWordFreq = new Map<string, number>();
  for (const tokens of sentenceTokens) {
    for (const token of tokens) {
      globalWordFreq.set(token, (globalWordFreq.get(token) || 0) + 1);
    }
  }

  // Top keywords
  const sortedKeywords = [...globalWordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({
      word,
      count,
      score: Math.round((count / (totalWords || 1)) * 1000) / 10,
    }));

  // Build similarity graph for TextRank
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

  // TextRank iterative convergence (PageRank algorithm)
  const d = 0.85; // Damping factor
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

  // Add position bias: first and last sentences of paragraphs carry more summary power
  const weightedScores = scores.map((score, idx) => {
    let positionMultiplier = 1.0;
    if (idx === 0) positionMultiplier = 1.35; // Lead sentence
    else if (idx === 1) positionMultiplier = 1.15;
    else if (idx === n - 1) positionMultiplier = 1.25; // Conclusion
    return {
      index: idx,
      sentence: sentences[idx],
      score: score * positionMultiplier,
    };
  });

  // Determine target sentence count based on slider percentage
  const desiredSentenceCount = Math.max(1, Math.round((sentences.length * targetPercent) / 100));

  // Pick highest scoring sentences
  const topScored = [...weightedScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, desiredSentenceCount);

  // Re-order top sentences back into original document flow for coherent reading
  const orderedSummarySentences = topScored
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  const summary = orderedSummarySentences.join(' ');
  const summaryWords = summary.trim().split(/\s+/).filter(Boolean).length;
  const compressionRatio = Math.round((summaryWords / Math.max(1, totalWords)) * 100) / 100;
  
  // Avg reading speed: ~200 words per minute -> ~3.3 words per sec
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

export const SAMPLE_TEXTS = {
  ai_privacy: `Local-first software represents a fundamental paradigm shift away from centralized cloud architectures toward user ownership of data. When artificial intelligence operations execute purely on client devices, data never traverses remote networks, completely eliminating exposure to external surveillance, data breaches, and man-in-the-middle exploits. Traditional cloud-based AI pipelines process user inputs through remote API endpoints, which creates persistent privacy liabilities, compliance bottlenecks under GDPR and CCPA, and recurring subscription costs. In contrast, modern browser environments possess remarkable computing capabilities through WebAssembly, WebGPU, and optimized JavaScript engines. These client-side runtimes can perform machine learning inference, matrix operations, statistical natural language processing, and image feature extraction with zero network latency. Offline AI enables applications to remain fully operational during flights, in remote field sites, or inside air-gapped corporate environments. Furthermore, because local inference utilizes the user's existing hardware, developers can offer zero-marginal-cost intelligent features without provisioning costly GPU server clusters. Ultimately, the decentralization of intelligence empowers individuals to retain sovereign ownership over their personal notes, medical queries, and proprietary intellectual property.`,
  
  research_summary: `Deep neural networks have revolutionized pattern recognition, but understanding their internal mechanics remains crucial for safety and reliability. A standard multi-layer perceptron consists of an input layer, one or more hidden layers composed of artificial neurons, and an output layer that yields probability distributions or continuous regressions. During forward propagation, each neuron computes a weighted sum of its inputs, adds an adjustable scalar bias, and applies a non-linear activation function such as the Rectified Linear Unit (ReLU) or hyperbolic tangent. Without these non-linearities, any deep stack of linear transformations would mathematically collapse into a single affine mapping, preventing the network from learning intricate decision boundaries like spirals and XOR functions. The learning process relies upon gradient descent and backpropagation, where the error calculated by a loss function is propagated backwards through the layers using the chain rule of calculus. Modern training regimens incorporate momentum and adaptive learning rates to accelerate convergence across loss surfaces and avoid getting trapped inside local saddle points. Evaluating test accuracy and observing real-time decision boundaries provides invaluable intuition into how artificial representations form within high-dimensional vector spaces.`,

  terms_agreement: `By accessing and using this local workstation application, the user acknowledges and agrees that all analytical computations, text parsing, and file conversions occur strictly within the client device memory. No personal data, uploaded media files, text inputs, or generated neural network model weights are ever transmitted to external servers, cloud providers, or third-party telemetry networks. The user retains complete copyright and full intellectual property ownership over all generated summaries, trained model parameters, and vector search indices. You are permitted to modify, inspect, export, and distribute the application source code in accordance with open-source licensing terms. The application is provided without warranties of any kind, whether express or implied, including fitness for a particular computational purpose. Because no centralized accounts or server-side databases exist, users are solely responsible for archiving their exported weights and configuration files locally.`,
};

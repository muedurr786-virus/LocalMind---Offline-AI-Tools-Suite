import { SearchResult, VectorDocument } from '../types';

export const INITIAL_KNOWLEDGE_BASE: VectorDocument[] = [
  {
    id: 'doc-1',
    title: 'Offline AI & Edge Computing Architecture',
    category: 'Architecture',
    content: `Local-first software stores all data primarily on the user's client device. In contrast to cloud architectures where client apps are thin shells awaiting responses from remote servers, offline-first systems perform machine learning inference, statistical computations, and data transformations locally in device memory. This eliminates network latency, guarantees 100% uptime during flights or in air-gapped secure labs, and provides structural privacy guarantees since sensitive inputs never leave hardware bounds. Technologies like WebAssembly, Canvas pixel access, and client-side matrix algorithms allow modern browsers to execute high-performance models directly.`
  },
  {
    id: 'doc-2',
    title: 'Neural Network Fundamentals & Backpropagation',
    category: 'Machine Learning',
    content: `A multi-layer perceptron (MLP) is composed of interconnected layers of artificial nodes. In the forward pass, inputs undergo linear matrix multiplications with learned weights, scalar bias additions, and non-linear activations such as ReLU or Sigmoid. Non-linear activation functions prevent the network from collapsing into a single linear mapping, allowing it to approximate arbitrary decision boundaries such as concentric circles, XOR parity problems, and interlocking spirals. During backpropagation, the loss function gradient is propagated backwards across layers using the chain rule of calculus, adjusting weights along the steepest descent direction.`
  },
  {
    id: 'doc-3',
    title: 'Extractive Summarization vs Abstractive Generation',
    category: 'NLP',
    content: `Extractive summarization identifies and extracts the most information-dense sentences directly from the source document without paraphrasing or hallucinating new words. Graph-based ranking algorithms like TextRank construct a network of sentences where edge weights represent lexical or semantic cosine similarity. Iterative random walk algorithms calculate sentence centrality, scoring sentences that best represent the entire document. Position weighting is commonly added to prioritize introductory theses and concluding deductions. This method requires zero remote API calls and produces highly factual, non-hallucinated summaries.`
  },
  {
    id: 'doc-4',
    title: 'Vector Embeddings & Semantic Similarity',
    category: 'Information Retrieval',
    content: `Vector embeddings represent text passages as high-dimensional coordinates in vector space where semantically similar concepts cluster together geometrically. In client-side environments without heavy cloud dependencies, BM25 term weighting combined with character n-grams and TF-IDF vectors delivers lightning-fast nearest-neighbor search. Cosine similarity calculates the dot product divided by the product of vector magnitudes, yielding an angular distance score from -1 to 1. This enables semantic document search, context retrieval, and local knowledge management directly inside web applications.`
  },
  {
    id: 'doc-5',
    title: 'Computer Vision & Optical Character Recognition',
    category: 'Vision',
    content: `Digital image processing in browsers utilizes the HTML5 Canvas 2D and WebGL APIs to access raw RGBA pixel arrays. Offline optical character recognition pipelines typically execute a series of deterministic steps: grayscale luminance mapping, Otsu binarization to separate ink from paper backgrounds, horizontal projection profiling to detect line baselines, and vertical segmentation to isolate individual word boundaries. Sobel filters compute 3x3 directional spatial gradients to detect hard edges, while k-means clustering in color space identifies dominant chromatic palettes.`
  }
];

export class VectorSearchEngine {
  private documents: VectorDocument[] = [];
  private vocab: Map<string, number> = new Map(); // term -> doc freq
  private docVectors: Map<string, Map<string, number>> = new Map();
  private docNorms: Map<string, number> = new Map();
  private avgDocLength = 0;

  constructor(initialDocs: VectorDocument[] = INITIAL_KNOWLEDGE_BASE) {
    this.documents = [...initialDocs];
    this.reindex();
  }

  getDocuments(): VectorDocument[] {
    return this.documents;
  }

  addDocument(doc: VectorDocument) {
    this.documents.push(doc);
    this.reindex();
  }

  deleteDocument(id: string) {
    this.documents = this.documents.filter((d) => d.id !== id);
    this.reindex();
  }

  private tokenize(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Also extract character 3-grams for fuzzy subword matching
    const ngrams: string[] = [];
    for (const w of words) {
      if (w.length >= 4) {
        for (let i = 0; i <= w.length - 3; i++) {
          ngrams.push(`_${w.slice(i, i + 3)}`);
        }
      }
    }

    return [...words, ...ngrams];
  }

  private reindex() {
    this.vocab.clear();
    this.docVectors.clear();
    this.docNorms.clear();

    const nDocs = this.documents.length;
    if (nDocs === 0) return;

    let totalLength = 0;
    const docTokensList: { id: string; tokens: string[] }[] = [];

    for (const doc of this.documents) {
      const fullText = `${doc.title} ${doc.category} ${doc.content}`;
      const tokens = this.tokenize(fullText);
      totalLength += tokens.length;
      docTokensList.push({ id: doc.id, tokens });

      // Unique terms for document frequency
      const unique = new Set(tokens);
      for (const t of unique) {
        this.vocab.set(t, (this.vocab.get(t) || 0) + 1);
      }
    }

    this.avgDocLength = totalLength / nDocs;

    // Calculate BM25-augmented TF-IDF vector for each document
    const k1 = 1.2;
    const b = 0.75;

    for (const { id, tokens } of docTokensList) {
      const tfMap = new Map<string, number>();
      for (const t of tokens) tfMap.set(t, (tfMap.get(t) || 0) + 1);

      const vector = new Map<string, number>();
      let normSq = 0;
      const docLen = tokens.length;

      for (const [term, freq] of tfMap.entries()) {
        const df = this.vocab.get(term) || 1;
        // IDF formula
        const idf = Math.log(1 + (nDocs - df + 0.5) / (df + 0.5));
        // BM25 term weighting
        const bm25 = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (docLen / (this.avgDocLength || 1))));
        const weight = idf * bm25;

        vector.set(term, weight);
        normSq += weight * weight;
      }

      this.docVectors.set(id, vector);
      this.docNorms.set(id, Math.sqrt(normSq));
    }
  }

  search(query: string, topK = 3): SearchResult[] {
    const qTokens = this.tokenize(query);
    if (qTokens.length === 0 || this.documents.length === 0) return [];

    const qFreq = new Map<string, number>();
    for (const t of qTokens) qFreq.set(t, (qFreq.get(t) || 0) + 1);

    const qVector = new Map<string, number>();
    let qNormSq = 0;
    const nDocs = this.documents.length;

    for (const [term, freq] of qFreq.entries()) {
      const df = this.vocab.get(term) || 0;
      const idf = Math.log(1 + (nDocs - df + 0.5) / (df + 0.5));
      const weight = idf * (1 + Math.log(freq));
      qVector.set(term, weight);
      qNormSq += weight * weight;
    }

    const qNorm = Math.sqrt(qNormSq);
    if (qNorm === 0) return [];

    const scored: { doc: VectorDocument; score: number }[] = [];

    for (const doc of this.documents) {
      const dVector = this.docVectors.get(doc.id);
      const dNorm = this.docNorms.get(doc.id) || 1;
      if (!dVector) continue;

      let dotProduct = 0;
      for (const [term, qWeight] of qVector.entries()) {
        if (dVector.has(term)) {
          dotProduct += qWeight * dVector.get(term)!;
        }
      }

      // Title match boost
      const queryLower = query.toLowerCase();
      if (doc.title.toLowerCase().includes(queryLower)) {
        dotProduct *= 1.4;
      }

      const cosineSim = dotProduct / (qNorm * dNorm);
      if (cosineSim > 0.05) {
        scored.push({
          doc,
          score: Math.min(1, Math.round(cosineSim * 100) / 100),
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(({ doc, score }) => {
      // Extract most relevant sentence snippets
      const sentences = doc.content
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const sentenceScores = sentences.map((sent) => {
        const sLower = sent.toLowerCase();
        let matchCount = 0;
        for (const token of qTokens) {
          if (!token.startsWith('_') && sLower.includes(token)) matchCount++;
        }
        return { sent, matchCount };
      });

      sentenceScores.sort((a, b) => b.matchCount - a.matchCount);
      const relevantSnippets = sentenceScores
        .filter((s) => s.matchCount > 0)
        .slice(0, 2)
        .map((s) => s.sent);

      return {
        doc,
        score,
        relevantSnippets: relevantSnippets.length > 0 ? relevantSnippets : [sentences[0] || ''],
      };
    });
  }
}

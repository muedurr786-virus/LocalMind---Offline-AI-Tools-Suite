import { SentimentResult } from '../types';

// Curated sentiment valence lexicon
const LEXICON: Record<string, number> = {
  // Strong positives
  excellent: 3.2, outstanding: 3.4, exceptional: 3.5, brilliant: 3.2, superb: 3.1,
  fantastic: 3.0, amazing: 3.2, awesome: 3.1, wonderful: 3.0, love: 3.1,
  perfect: 3.3, triumph: 3.0, masterpiece: 3.5, visionary: 2.8, great: 2.5,
  good: 1.8, nice: 1.5, happy: 2.3, delighted: 2.8, joyful: 2.9,
  breakthrough: 2.9, innovative: 2.6, reliable: 2.4, trusted: 2.5, secure: 2.2,
  efficient: 2.1, robust: 2.3, high: 1.2, best: 2.7, better: 1.6,
  recommend: 2.1, succeed: 2.5, successful: 2.6, gain: 1.8, win: 2.5,
  benefit: 2.0, advantageous: 2.2, positive: 2.0, pleased: 2.1, clear: 1.5,

  // Moderate positives
  fine: 1.0, helpful: 1.8, neat: 1.5, safe: 1.9, solid: 1.7,
  stable: 1.8, smooth: 1.6, easy: 1.6, fast: 1.5, smart: 1.9,
  bright: 1.4, clean: 1.5, valuable: 2.2, profit: 1.8, ideal: 2.4,

  // Neutrals / Contextual
  average: 0.1, standard: 0.0, normal: 0.0, moderate: 0.0, expected: 0.0,
  regular: 0.0, typical: 0.0, ok: 0.5, okay: 0.5,

  // Moderate negatives
  slow: -1.4, difficult: -1.6, hard: -1.2, complex: -0.8, delay: -1.5,
  expensive: -1.4, boring: -1.8, weak: -1.8, confusing: -1.9, missing: -1.5,
  issue: -1.4, trouble: -1.7, problem: -1.6, warning: -1.3, caution: -1.0,
  risk: -1.5, risky: -1.8, tired: -1.4, limited: -1.2, flawed: -2.0,

  // Strong negatives
  terrible: -3.2, awful: -3.3, horrible: -3.4, disastrous: -3.6, catastrophic: -3.8,
  hate: -3.2, worst: -3.4, broken: -2.7, fail: -2.6, failure: -2.8,
  crash: -2.9, dangerous: -2.8, vulnerability: -2.7, breach: -3.0, malicious: -3.2,
  corrupt: -3.0, exploit: -2.6, scam: -3.4, fraud: -3.5, defective: -2.7,
  inferior: -2.4, painful: -2.5, angry: -2.6, frustration: -2.4, disappointed: -2.5,
  disaster: -3.5, dread: -3.0, unplayable: -3.1, toxic: -3.3, regret: -2.4,
};

const INTENSIFIERS: Record<string, number> = {
  very: 0.293,
  extremely: 0.395,
  incredibly: 0.375,
  really: 0.25,
  absolutely: 0.38,
  completely: 0.33,
  totally: 0.32,
  especially: 0.22,
  exceptionally: 0.36,
  significantly: 0.27,
  immensely: 0.35,
  so: 0.2,
  quite: 0.15,
};

const NEGATIONS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'hardly', 'scarcely', 'barely',
  'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t',
  'doesn\'t', 'don\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'cannot', 'can\'t', 'couldn\'t'
]);

export function analyzeSentiment(text: string): SentimentResult {
  const clean = text.trim();
  if (!clean) {
    return {
      score: 0,
      classification: 'neutral',
      confidence: 0,
      emotions: { joy: 0, urgency: 0, confidence: 0.5, caution: 0, frustration: 0 },
      sentenceBreakdown: [],
      wordHighlights: [],
    };
  }

  // Split into raw sentences
  const rawSentences = clean
    .replace(/([.?!]+)\s*(?=[A-Z0-9"“])/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter(Boolean);

  const wordHighlights: SentimentResult['wordHighlights'] = [];
  const sentenceBreakdown: SentimentResult['sentenceBreakdown'] = [];

  let overallScoreSum = 0;
  let emotionJoy = 0;
  let emotionFrustration = 0;
  let emotionUrgency = 0;
  let emotionCaution = 0;
  let emotionConfidence = 0;

  for (const rawSentence of rawSentences) {
    const tokens = rawSentence.split(/\s+/).filter(Boolean);
    let sentenceScore = 0;
    let wordCountInSentence = 0;

    for (let i = 0; i < tokens.length; i++) {
      const rawWord = tokens[i];
      const cleanWord = rawWord.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');

      // Check for contrastive 'but'/'however'
      if (cleanWord === 'but' || cleanWord === 'however' || cleanWord === 'yet') {
        // Words after 'but' carry more perceptual weight
        sentenceScore *= 0.5;
        continue;
      }

      // Check intensifier
      let boost = 0;
      if (i > 0) {
        const prev1 = tokens[i - 1].toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
        if (INTENSIFIERS[prev1]) boost += INTENSIFIERS[prev1];
      }

      // Check negation in preceding 3 words
      let isNegated = false;
      for (let lookback = 1; lookback <= 3; lookback++) {
        if (i - lookback >= 0) {
          const prev = tokens[i - lookback].toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
          if (NEGATIONS.has(prev)) {
            isNegated = true;
            break;
          }
        }
      }

      if (LEXICON[cleanWord] !== undefined) {
        let val = LEXICON[cleanWord];

        // All-caps boost
        if (rawWord.length > 2 && rawWord === rawWord.toUpperCase()) {
          val += val > 0 ? 0.73 : -0.73;
        }

        // Apply intensifier
        if (val > 0) val += boost;
        else val -= boost;

        // Apply negation
        if (isNegated) {
          val *= -0.74;
        }

        sentenceScore += val;
        wordCountInSentence++;

        wordHighlights.push({
          word: rawWord,
          score: Math.round(val * 10) / 10,
          type: isNegated ? 'negator' : val > 0 ? 'positive' : 'negative',
        });

        // Emotion tallies
        if (val > 1.5) emotionJoy += val;
        if (val < -1.5) emotionFrustration += Math.abs(val);
        if (cleanWord === 'fast' || cleanWord === 'urgent' || cleanWord === 'risk' || cleanWord === 'immediately' || rawWord.includes('!')) {
          emotionUrgency += 1.5;
        }
        if (cleanWord === 'caution' || cleanWord === 'warning' || cleanWord === 'limit' || isNegated) {
          emotionCaution += 1.2;
        }
        if (cleanWord === 'secure' || cleanWord === 'reliable' || cleanWord === 'proven' || cleanWord === 'certain') {
          emotionConfidence += 1.8;
        }
      }
    }

    // Exclamation marks boost sentence intensity
    const exclamations = (rawSentence.match(/!/g) || []).length;
    if (exclamations > 0) {
      sentenceScore += Math.sign(sentenceScore || 1) * Math.min(3, exclamations) * 0.29;
    }

    // Normalized compound score via tanh / standard VADER normalization
    const normalizedSentenceScore =
      sentenceScore / Math.sqrt(sentenceScore * sentenceScore + 15);
    const clampedScore = Math.max(-1, Math.min(1, Math.round(normalizedSentenceScore * 100) / 100));

    let sentenceClass: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (clampedScore >= 0.1) sentenceClass = 'positive';
    else if (clampedScore <= -0.1) sentenceClass = 'negative';

    sentenceBreakdown.push({
      sentence: rawSentence,
      score: clampedScore,
      classification: sentenceClass,
    });

    overallScoreSum += clampedScore;
  }

  const finalAvg = sentenceBreakdown.length > 0 ? overallScoreSum / sentenceBreakdown.length : 0;
  const normalizedOverall = Math.max(-1, Math.min(1, Math.round(finalAvg * 100) / 100));

  let classification: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (normalizedOverall >= 0.15) classification = 'positive';
  else if (normalizedOverall <= -0.15) classification = 'negative';

  const confidence = Math.min(1, Math.round((Math.abs(normalizedOverall) * 0.6 + 0.4) * 100) / 100);

  // Normalize emotions to 0..1 scale
  const totalEmotionWeight = emotionJoy + emotionFrustration + emotionUrgency + emotionCaution + emotionConfidence + 1;
  const emotions = {
    joy: Math.min(1, Math.round((emotionJoy / totalEmotionWeight) * 200) / 100),
    urgency: Math.min(1, Math.round((emotionUrgency / totalEmotionWeight) * 200) / 100),
    confidence: Math.min(1, Math.round((emotionConfidence / totalEmotionWeight + 0.3) * 100) / 100),
    caution: Math.min(1, Math.round((emotionCaution / totalEmotionWeight) * 200) / 100),
    frustration: Math.min(1, Math.round((emotionFrustration / totalEmotionWeight) * 200) / 100),
  };

  return {
    score: normalizedOverall,
    classification,
    confidence,
    emotions,
    sentenceBreakdown,
    wordHighlights,
  };
}

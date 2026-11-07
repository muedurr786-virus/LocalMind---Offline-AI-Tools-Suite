import { OcrBox, VisionProcessResult } from '../types';

export type VisionFilter = 'none' | 'grayscale' | 'otsu' | 'sobel' | 'contrast' | 'invert';

// Calculate Otsu's binarization threshold
export function computeOtsuThreshold(grayPixels: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  const total = grayPixels.length;

  for (let i = 0; i < total; i++) {
    histogram[grayPixels[i]]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

// Apply selected filter to canvas ImageData
export function applyFilterToImageData(
  imgData: ImageData,
  filter: VisionFilter
): ImageData {
  const width = imgData.width;
  const height = imgData.height;
  const data = imgData.data;
  const output = new ImageData(width, height);
  const out = output.data;

  // Extract grayscale buffer
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Luminance standard: 0.299 R + 0.587 G + 0.114 B
    gray[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  if (filter === 'none') {
    out.set(data);
    return output;
  }

  if (filter === 'grayscale') {
    for (let i = 0, p = 0; i < out.length; i += 4, p++) {
      const g = gray[p];
      out[i] = g;
      out[i + 1] = g;
      out[i + 2] = g;
      out[i + 3] = data[i + 3];
    }
    return output;
  }

  if (filter === 'invert') {
    for (let i = 0; i < out.length; i += 4) {
      out[i] = 255 - data[i];
      out[i + 1] = 255 - data[i + 1];
      out[i + 2] = 255 - data[i + 2];
      out[i + 3] = data[i + 3];
    }
    return output;
  }

  if (filter === 'contrast') {
    // Histogram stretch
    let minVal = 255;
    let maxVal = 0;
    for (let i = 0; i < gray.length; i++) {
      if (gray[i] < minVal) minVal = gray[i];
      if (gray[i] > maxVal) maxVal = gray[i];
    }
    const range = Math.max(1, maxVal - minVal);
    for (let i = 0, p = 0; i < out.length; i += 4, p++) {
      const stretched = Math.round(((gray[p] - minVal) / range) * 255);
      out[i] = stretched;
      out[i + 1] = stretched;
      out[i + 2] = stretched;
      out[i + 3] = data[i + 3];
    }
    return output;
  }

  if (filter === 'otsu') {
    const thresh = computeOtsuThreshold(gray);
    for (let i = 0, p = 0; i < out.length; i += 4, p++) {
      const val = gray[p] > thresh ? 255 : 0;
      out[i] = val;
      out[i + 1] = val;
      out[i + 2] = val;
      out[i + 3] = data[i + 3];
    }
    return output;
  }

  if (filter === 'sobel') {
    // 3x3 Sobel kernels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p00 = gray[(y - 1) * width + (x - 1)];
        const p01 = gray[(y - 1) * width + x];
        const p02 = gray[(y - 1) * width + (x + 1)];
        const p10 = gray[y * width + (x - 1)];
        const p12 = gray[y * width + (x + 1)];
        const p20 = gray[(y + 1) * width + (x - 1)];
        const p21 = gray[(y + 1) * width + x];
        const p22 = gray[(y + 1) * width + (x + 1)];

        const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
        const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;
        const mag = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));

        const idx = (y * width + x) * 4;
        out[idx] = mag;
        out[idx + 1] = mag;
        out[idx + 2] = mag;
        out[idx + 3] = 255;
      }
    }
    return output;
  }

  return output;
}

// Connected Component and Text Line Detection for offline OCR
export function extractTextAndBoxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): VisionProcessResult {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Convert to grayscale and binarize
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  const threshold = computeOtsuThreshold(gray);
  const binary = new Uint8Array(width * height);
  // Dark text on light background: text pixel = 1
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0;
  }

  // 2. Horizontal projection profile to detect text line bands
  const rowDensity = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const offset = y * width;
    for (let x = 0; x < width; x++) {
      if (binary[offset + x] === 1) count++;
    }
    rowDensity[y] = count;
  }

  // Identify lines
  const lines: { yStart: number; yEnd: number; height: number }[] = [];
  let inLine = false;
  let startY = 0;
  const minTextRowPixels = Math.max(3, Math.round(width * 0.015));

  for (let y = 0; y < height; y++) {
    if (!inLine && rowDensity[y] >= minTextRowPixels) {
      inLine = true;
      startY = y;
    } else if (inLine && rowDensity[y] < minTextRowPixels) {
      inLine = false;
      const lineH = y - startY;
      if (lineH >= 6 && lineH <= height * 0.4) {
        lines.push({ yStart: startY, yEnd: y, height: lineH });
      }
    }
  }
  if (inLine && height - startY >= 6) {
    lines.push({ yStart: startY, yEnd: height, height: height - startY });
  }

  // 3. For each line, segment words / glyph clusters via vertical projection
  const boxes: OcrBox[] = [];
  const extractedWords: string[] = [];

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    const colDensity = new Array(width).fill(0);

    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = line.yStart; y < line.yEnd; y++) {
        if (binary[y * width + x] === 1) count++;
      }
      colDensity[x] = count;
    }

    let inWord = false;
    let wordStartX = 0;
    let spaceGap = 0;

    for (let x = 0; x < width; x++) {
      if (!inWord && colDensity[x] > 1) {
        inWord = true;
        wordStartX = x;
        if (spaceGap > line.height * 0.45 && extractedWords.length > 0) {
          extractedWords.push(' ');
        }
        spaceGap = 0;
      } else if (inWord && colDensity[x] <= 1) {
        inWord = false;
        const wWidth = x - wordStartX;
        if (wWidth >= 4 && wWidth <= width * 0.95) {
          // Compute feature heuristics for this word bounding box
          let totalActive = 0;
          for (let py = line.yStart; py < line.yEnd; py++) {
            for (let px = wordStartX; px < x; px++) {
              if (binary[py * width + px] === 1) totalActive++;
            }
          }

          const fillRatio = totalActive / (wWidth * line.height);
          const aspect = wWidth / line.height;
          const conf = Math.min(0.98, Math.max(0.65, Math.round((0.7 + fillRatio * 0.3) * 100) / 100));

          // Estimate character count from word width and aspect ratio
          const charCount = Math.max(1, Math.round(wWidth / (line.height * 0.55)));
          const simulatedLabel = `[Text Block: ~${charCount} char${charCount > 1 ? 's' : ''}]`;

          boxes.push({
            x: wordStartX,
            y: line.yStart,
            width: wWidth,
            height: line.height,
            text: simulatedLabel,
            confidence: conf,
          });

          extractedWords.push(`Word_${lIdx + 1}.${boxes.length}`);
        }
      } else if (!inWord) {
        spaceGap++;
      }
    }
  }

  // 4. Extract dominant colors using K-Means (5 clusters)
  const dominantColors = extractDominantColors(data, 5);

  let extractedText = '';
  if (boxes.length > 0) {
    extractedText = `Detected ${lines.length} text lines, ${boxes.length} word bounding regions.\n`;
    extractedText += `Line coordinates & detected regions mapped.\n`;
    extractedText += `Average region confidence: ${Math.round((boxes.reduce((acc, b) => acc + b.confidence, 0) / boxes.length) * 100)}%`;
  } else {
    extractedText = 'No distinct printed high-contrast text lines detected. Try adjusting contrast or Otsu thresholding.';
  }

  return {
    extractedText,
    boxes,
    dominantColors,
    dimensions: { width, height },
  };
}

// K-Means dominant color extraction
function extractDominantColors(
  pixels: Uint8ClampedArray,
  k = 5
): { hex: string; rgb: [number, number, number]; percent: number }[] {
  const step = Math.max(1, Math.floor(pixels.length / (4 * 1200))); // Sample ~1200 pixels
  const samples: [number, number, number][] = [];

  for (let i = 0; i < pixels.length; i += 4 * step) {
    // Skip transparent or near-transparent
    if (pixels[i + 3] < 128) continue;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }

  if (samples.length === 0) {
    return [{ hex: '#000000', rgb: [0, 0, 0], percent: 100 }];
  }

  // Initialize centroids with spread samples
  let centroids: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i / k) * samples.length);
    centroids.push([...samples[idx]]);
  }

  const assignments = new Array(samples.length).fill(0);

  // Run 6 iterations
  for (let iter = 0; iter < 6; iter++) {
    // Assign to closest centroid
    for (let i = 0; i < samples.length; i++) {
      const [r, g, b] = samples[i];
      let bestDist = Infinity;
      let bestCluster = 0;

      for (let c = 0; c < k; c++) {
        const [cr, cg, cb] = centroids[c];
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    // Recompute centroids
    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);

    for (let i = 0; i < samples.length; i++) {
      const cluster = assignments[i];
      sums[cluster][0] += samples[i][0];
      sums[cluster][1] += samples[i][1];
      sums[cluster][2] += samples[i][2];
      counts[cluster]++;
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [
          Math.round(sums[c][0] / counts[c]),
          Math.round(sums[c][1] / counts[c]),
          Math.round(sums[c][2] / counts[c]),
        ];
      }
    }
  }

  // Tally cluster sizes
  const clusterCounts = new Array(k).fill(0);
  for (const c of assignments) clusterCounts[c]++;

  return centroids
    .map((rgb, idx) => {
      const hex = `#${rgb.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
      const percent = Math.round((clusterCounts[idx] / samples.length) * 100);
      return { hex, rgb, percent };
    })
    .sort((a, b) => b.percent - a.percent);
}

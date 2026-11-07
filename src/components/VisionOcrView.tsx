import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Eye, Image as ImageIcon, Download, Copy, Check, Filter } from 'lucide-react';
import { applyFilterToImageData, extractTextAndBoxes, VisionFilter } from '../engines/visionOcr';
import { OcrBox, VisionProcessResult } from '../types';

export const VisionOcrView: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<VisionFilter>('none');
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [visionResult, setVisionResult] = useState<VisionProcessResult | null>(null);
  const [hoveredBox, setHoveredBox] = useState<OcrBox | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Load a synthetic high-contrast document graphic into an image
  const generateSampleImage = useCallback((type: 'receipt' | 'sign' | 'handwriting') => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 340;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    if (type === 'receipt') {
      // Paper background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 500, 340);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillText('LOCALMIND LABS INC.', 110, 45);

      ctx.font = '14px "Courier New", monospace';
      ctx.fillText('Receipt #: INV-882941', 40, 80);
      ctx.fillText('Date: 2026-11-07  07:18 PST', 40, 105);
      ctx.fillText('--------------------------------------', 40, 125);
      ctx.fillText('Item                    Qty      Amt', 40, 145);
      ctx.fillText('--------------------------------------', 40, 165);
      ctx.fillText('Offline AI Engine Core    1   $49.00', 40, 190);
      ctx.fillText('Neural Net Studio License 1   $29.00', 40, 215);
      ctx.fillText('Vector Search Module      1   $19.00', 40, 240);
      ctx.fillText('--------------------------------------', 40, 260);
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('TOTAL DUE                     $97.00', 40, 290);
      ctx.font = 'italic 12px "Courier New", monospace';
      ctx.fillText('Paid via On-Device Local Token. Thank you!', 40, 318);
    } else if (type === 'sign') {
      // Dark urban sign with cyan neon
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 500, 340);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 440, 280);

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('NEURAL WORKSTATION', 55, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SECURE AIR-GAPPED ZONE', 90, 170);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('ALL TELEMETRY BLOCKED · LOCAL STORAGE ONLY', 75, 230);
      ctx.fillText('AUTHORIZED PERSONNEL ONLY', 145, 275);
    } else {
      // Handwriting simulation
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(0, 0, 500, 340);

      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.fillStyle = '#1e3a8a';
      ctx.font = '28px "Caveat", "Brush Script MT", cursive, sans-serif';
      ctx.fillText('Meeting Notes: Local-First AI', 40, 60);
      ctx.font = '20px "Caveat", "Brush Script MT", cursive, sans-serif';
      ctx.fillText('1. No external cloud dependencies', 50, 110);
      ctx.fillText('2. Fast local matrix math in JS', 50, 150);
      ctx.fillText('3. Real-time vision segmentation', 50, 190);
      ctx.fillText('4. Full source code exported in ZIP', 50, 230);
      ctx.fillText('Ready for field deployment!', 50, 280);
    }

    const img = new Image();
    img.src = tempCanvas.toDataURL('image/png');
    img.onload = () => {
      originalImageRef.current = img;
      processCurrentCanvas();
    };
  }, []);

  // Process canvas whenever filter or image changes
  const processCurrentCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Apply chosen filter
    if (selectedFilter !== 'none') {
      const rawData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const filtered = applyFilterToImageData(rawData, selectedFilter);
      ctx.putImageData(filtered, 0, 0);
    }

    // Extract text boxes and dominant colors
    const results = extractTextAndBoxes(ctx, canvas.width, canvas.height);
    setVisionResult(results);

    // Overlay bounding boxes if enabled
    if (showBoxes && results.boxes.length > 0) {
      for (const box of results.boxes) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Highlight label tag
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.fillRect(box.x, box.y, box.width, box.height);
      }
    }
  }, [selectedFilter, showBoxes]);

  useEffect(() => {
    generateSampleImage('receipt');
  }, [generateSampleImage]);

  useEffect(() => {
    processCurrentCanvas();
  }, [processCurrentCanvas]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        originalImageRef.current = img;
        processCurrentCanvas();
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `localmind-vision-${selectedFilter}.png`;
    a.click();
  };

  const handleCopyText = () => {
    if (!visionResult) return;
    navigator.clipboard.writeText(visionResult.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Local Vision & OCR Engine</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browser-native pixel filters, Otsu binarization, Sobel edge gradients, and horizontal line segmentation.
          </p>
        </div>

        {/* Sample Image Presets & Upload */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => generateSampleImage('receipt')}
              className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              Invoice
            </button>
            <button
              onClick={() => generateSampleImage('sign')}
              className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              Signage
            </button>
            <button
              onClick={() => generateSampleImage('handwriting')}
              className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              Notes
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs rounded-lg transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Grid: Left Canvas + Right Feature Extraction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Canvas Viewport & Filter Bar */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'none', label: 'Original' },
                  { id: 'grayscale', label: 'Grayscale' },
                  { id: 'otsu', label: 'Otsu Binarize' },
                  { id: 'sobel', label: 'Sobel Edges' },
                  { id: 'contrast', label: 'High Contrast' },
                  { id: 'invert', label: 'Invert' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                    selectedFilter === f.id
                      ? 'bg-neutral-800 text-cyan-400 font-medium border border-neutral-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBoxes}
                  onChange={(e) => setShowBoxes(e.target.checked)}
                  className="rounded border-neutral-700 text-cyan-400 focus:ring-0"
                />
                <span>OCR Boxes</span>
              </label>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="relative border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 flex items-center justify-center p-2 min-h-[360px]">
            <canvas ref={canvasRef} className="max-w-full max-h-[460px] object-contain rounded" />
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <span className="font-mono tabular-nums">
              {visionResult ? `${visionResult.dimensions.width} × ${visionResult.dimensions.height}px` : 'Loading'}
            </span>

            <button
              onClick={handleDownloadCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Canvas PNG</span>
            </button>
          </div>
        </div>

        {/* Right Column: OCR Results & Palette Extractor */}
        <div className="lg:col-span-5 space-y-5">
          {/* OCR Summary Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-200">Optical Detection Report</h2>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-500 block">Detected Regions</span>
                <span className="text-lg font-bold font-mono tabular-nums text-cyan-400 mt-0.5 block">
                  {visionResult?.boxes.length || 0}
                </span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-500 block">Avg Confidence</span>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5 block">
                  {visionResult && visionResult.boxes.length > 0
                    ? `${Math.round(
                        (visionResult.boxes.reduce((acc, b) => acc + b.confidence, 0) / visionResult.boxes.length) *
                          100
                      )}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 whitespace-pre-line leading-relaxed max-h-[160px] overflow-y-auto">
              {visionResult?.extractedText}
            </div>
          </div>

          {/* Dominant Color Palette (K-Means) */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200">K-Means Color Palette Quantization</h2>
            <p className="text-xs text-neutral-400">
              5-cluster RGB centroid convergence for visual asset analysis.
            </p>

            <div className="space-y-2 pt-1">
              {visionResult?.dominantColors.map((col, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                  <span
                    className="w-5 h-5 rounded border border-white/20 shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="font-mono text-neutral-200 uppercase">{col.hex}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">
                    rgb({col.rgb.join(', ')})
                  </span>
                  <span className="ml-auto font-mono tabular-nums text-neutral-400">
                    {col.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

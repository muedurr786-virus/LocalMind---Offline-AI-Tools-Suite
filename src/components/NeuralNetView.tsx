import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward, Download, Upload, PlusCircle, Check } from 'lucide-react';
import { NeuralNetwork, generateDataset } from '../engines/neuralNetwork';
import { ActivationType, DataPoint, NeuralNetConfig } from '../types';

export const NeuralNetView: React.FC = () => {
  const [datasetType, setDatasetType] = useState<'spiral' | 'circle' | 'xor' | 'moons' | 'clusters'>('spiral');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => generateDataset('spiral', 180));
  const [hiddenSize1, setHiddenSize1] = useState<number>(8);
  const [hiddenSize2, setHiddenSize2] = useState<number>(8);
  const [useTwoLayers, setUseTwoLayers] = useState<boolean>(true);
  const [activation, setActivation] = useState<ActivationType>('tanh');
  const [learningRate, setLearningRate] = useState<number>(0.08);

  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [epoch, setEpoch] = useState<number>(0);
  const [loss, setLoss] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number; prob: number } | null>(null);
  const [addModeClass, setAddModeClass] = useState<0 | 1 | null>(null);
  const [copiedModel, setCopiedModel] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nnRef = useRef<NeuralNetwork | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize or re-create Neural Network instance
  const initNetwork = useCallback(() => {
    const config: NeuralNetConfig = {
      inputSize: 2,
      hiddenLayers: useTwoLayers ? [hiddenSize1, hiddenSize2] : [hiddenSize1],
      outputSize: 1,
      activation,
      learningRate,
    };
    nnRef.current = new NeuralNetwork(config);
    setEpoch(0);
    setLoss(0);
    setAccuracy(0);
    setLossHistory([]);
  }, [hiddenSize1, hiddenSize2, useTwoLayers, activation, learningRate]);

  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  // Handle dataset switch
  const handleDatasetChange = (type: 'spiral' | 'circle' | 'xor' | 'moons' | 'clusters') => {
    setDatasetType(type);
    const newPoints = generateDataset(type, 180);
    setDataPoints(newPoints);
    initNetwork();
  };

  // Perform single training step
  const stepTraining = useCallback(() => {
    if (!nnRef.current) return;
    const metrics = nnRef.current.trainStep(dataPoints, 24);
    setEpoch((prev) => prev + 1);
    setLoss(metrics.loss);
    setAccuracy(metrics.accuracy);
    setLossHistory((prev) => {
      const updated = [...prev, metrics.loss];
      return updated.length > 80 ? updated.slice(updated.length - 80) : updated;
    });
  }, [dataPoints]);

  // Training loop
  useEffect(() => {
    if (!isTraining) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const loop = () => {
      // Run multiple internal mini-steps per animation frame for swift convergence
      for (let s = 0; s < 4; s++) {
        stepTraining();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTraining, stepTraining]);

  // Render decision boundary on canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nnRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const resolution = 40; // 40x40 grid for smooth boundary rendering
    const cellW = width / resolution;
    const cellH = height / resolution;

    // 1. Draw decision boundary field
    const imgData = ctx.createImageData(resolution, resolution);
    const data = imgData.data;

    for (let r = 0; r < resolution; r++) {
      for (let c = 0; c < resolution; c++) {
        // Map grid cell [0..resolution] to model input space [-1.2 .. 1.2]
        const nx = ((c + 0.5) / resolution) * 2.4 - 1.2;
        const ny = (1 - (r + 0.5) / resolution) * 2.4 - 1.2;

        const pred = nnRef.current.predict([nx, ny])[0]; // [0..1]
        const idx = (r * resolution + c) * 4;

        // Class 0: Deep Indigo/Blue (RGB ~ 15, 23, 42 -> 30, 58, 138)
        // Class 1: Vivid Amber/Orange (RGB ~ 217, 119, 6 -> 245, 158, 11)
        if (pred < 0.5) {
          const t = 1 - pred * 2; // 0 to 1
          data[idx] = Math.round(15 + t * 25);
          data[idx + 1] = Math.round(23 + t * 65);
          data[idx + 2] = Math.round(42 + t * 140);
          data[idx + 3] = 255;
        } else {
          const t = (pred - 0.5) * 2; // 0 to 1
          data[idx] = Math.round(20 + t * 215);
          data[idx + 1] = Math.round(30 + t * 110);
          data[idx + 2] = Math.round(40 + t * 15);
          data[idx + 3] = 255;
        }
      }
    }

    // Upscale smooth image onto canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = resolution;
    offscreen.height = resolution;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offscreen, 0, 0, width, height);
    }

    // 2. Draw coordinate axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // X axis
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    // Y axis
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // 3. Draw dataset points
    for (const pt of dataPoints) {
      // Map [-1.2..1.2] to [0..width, 0..height]
      const px = ((pt.x + 1.2) / 2.4) * width;
      const py = (1 - (pt.y + 1.2) / 2.4) * height;

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      if (pt.label === 1) {
        ctx.fillStyle = '#f59e0b'; // Amber Class 1
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#38bdf8'; // Sky/Blue Class 0
        ctx.strokeStyle = '#0f172a';
      }
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }
  }, [dataPoints]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, epoch]);

  // Render live loss curve
  useEffect(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (lossHistory.length < 2) return;

    const maxLoss = Math.max(1.0, ...lossHistory);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < lossHistory.length; i++) {
      const x = (i / (lossHistory.length - 1)) * w;
      const y = h - (lossHistory[i] / maxLoss) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [lossHistory]);

  // Canvas interaction
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !nnRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const xPixel = e.clientX - rect.left;
    const yPixel = e.clientY - rect.top;

    const nx = (xPixel / canvas.width) * 2.4 - 1.2;
    const ny = (1 - yPixel / canvas.height) * 2.4 - 1.2;

    const prob = nnRef.current.predict([nx, ny])[0];
    setMouseCoord({
      x: Math.round(nx * 100) / 100,
      y: Math.round(ny * 100) / 100,
      prob: Math.round(prob * 1000) / 1000,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (addModeClass === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPixel = e.clientX - rect.left;
    const yPixel = e.clientY - rect.top;

    const nx = (xPixel / canvas.width) * 2.4 - 1.2;
    const ny = (1 - yPixel / canvas.height) * 2.4 - 1.2;

    setDataPoints((prev) => [...prev, { x: nx, y: ny, label: addModeClass }]);
  };

  const handleExportModel = () => {
    if (!nnRef.current) return;
    const json = nnRef.current.exportModel();
    navigator.clipboard.writeText(json);
    setCopiedModel(true);
    setTimeout(() => setCopiedModel(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Neural Network Laboratory</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time deep learning engine running in TypeScript. Backpropagation with momentum and 2D decision boundary visualization.
          </p>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          {(['spiral', 'moons', 'circle', 'xor', 'clusters'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleDatasetChange(type)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                datasetType === type
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Canvas Viewport + Right Hyperparameter & Metrics Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Canvas */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-neutral-400 mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                Class 0 (p &lt; 0.5)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Class 1 (p &ge; 0.5)
              </span>
            </div>

            {mouseCoord && (
              <span className="font-mono tabular-nums text-neutral-300">
                x: {mouseCoord.x.toFixed(2)} y: {mouseCoord.y.toFixed(2)} · P(1) = {mouseCoord.prob.toFixed(3)}
              </span>
            )}
          </div>

          {/* Decision Boundary Canvas */}
          <div className="relative border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setMouseCoord(null)}
              onClick={handleCanvasClick}
              className={`w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] block ${
                addModeClass !== null ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
          </div>

          {/* Canvas Actions */}
          <div className="w-full flex items-center justify-between text-xs text-neutral-400 mt-4 pt-3 border-t border-neutral-800/80">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Add point:</span>
              <button
                onClick={() => setAddModeClass(addModeClass === 0 ? null : 0)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  addModeClass === 0
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3 h-3" /> Class 0
              </button>
              <button
                onClick={() => setAddModeClass(addModeClass === 1 ? null : 1)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  addModeClass === 1
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3 h-3" /> Class 1
              </button>
            </div>

            <span className="font-mono tabular-nums text-neutral-400">
              {dataPoints.length} points
            </span>
          </div>
        </div>

        {/* Right: Metrics, Controls, Hyperparameters */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time KPI Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200">Execution Telemetry</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <span className="text-xs text-neutral-500 block">Epochs</span>
                <span className="text-lg font-bold font-mono tabular-nums text-white">{epoch}</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <span className="text-xs text-neutral-500 block">Loss (BCE)</span>
                <span className="text-lg font-bold font-mono tabular-nums text-cyan-400">
                  {loss.toFixed(4)}
                </span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <span className="text-xs text-neutral-500 block">Accuracy</span>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                  {(accuracy * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Live Loss Chart Canvas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Loss Curve History</span>
                <span className="font-mono tabular-nums">Recent 80 steps</span>
              </div>
              <canvas
                ref={lossCanvasRef}
                width={340}
                height={70}
                className="w-full h-[70px] rounded bg-neutral-950 border border-neutral-800/80 block"
              />
            </div>

            {/* Playback Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsTraining(!isTraining)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                  isTraining
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-neutral-950'
                }`}
              >
                {isTraining ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTraining ? 'Pause Training' : 'Start Training'}</span>
              </button>

              <button
                onClick={stepTraining}
                disabled={isTraining}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                title="Single Step"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Step</span>
              </button>

              <button
                onClick={initNetwork}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                title="Reset Weights"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Network Architecture & Hyperparameters */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200">Architecture & Hyperparameters</h2>

            <div className="space-y-3 text-xs">
              {/* Activation Function */}
              <div>
                <label className="text-neutral-400 block mb-1.5">Activation Function</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['tanh', 'relu', 'leaky_relu', 'sigmoid'] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => setActivation(act)}
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        activation === act
                          ? 'bg-neutral-800 border-cyan-400 text-cyan-400 font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {act.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer Neurons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Hidden Layer 1</span>
                    <span className="font-mono tabular-nums text-white">{hiddenSize1}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    value={hiddenSize1}
                    onChange={(e) => setHiddenSize1(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Hidden Layer 2</span>
                    <span className="font-mono tabular-nums text-white">
                      {useTwoLayers ? hiddenSize2 : 'Disabled'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    disabled={!useTwoLayers}
                    value={hiddenSize2}
                    onChange={(e) => setHiddenSize2(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="twoLayers"
                  checked={useTwoLayers}
                  onChange={(e) => setUseTwoLayers(e.target.checked)}
                  className="rounded border-neutral-700 text-cyan-400 focus:ring-0"
                />
                <label htmlFor="twoLayers" className="text-neutral-300 cursor-pointer">
                  Enable 2nd Hidden Layer
                </label>
              </div>

              {/* Learning Rate */}
              <div className="pt-2">
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Learning Rate (SGD + Momentum)</span>
                  <span className="font-mono tabular-nums text-white">{learningRate.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.3}
                  step={0.01}
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Export/Import Weights */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={handleExportModel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded transition-colors"
                >
                  {copiedModel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copiedModel ? 'Weights Copied!' : 'Export Weights JSON'}</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (nnRef.current?.importModel(content)) {
                          renderCanvas();
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

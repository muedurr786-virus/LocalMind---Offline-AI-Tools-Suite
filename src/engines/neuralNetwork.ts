import { ActivationType, DataPoint, NeuralNetConfig } from '../types';

export class Layer {
  weights: number[][]; // [outputs][inputs]
  biases: number[];
  inputs: number[] = [];
  outputs: number[] = [];
  activations: number[] = [];
  dWeights: number[][];
  dBiases: number[];
  vWeights: number[][]; // Momentum
  vBiases: number[];

  constructor(public inputSize: number, public outputSize: number) {
    this.weights = [];
    this.biases = [];
    this.dWeights = [];
    this.dBiases = [];
    this.vWeights = [];
    this.vBiases = [];

    // He / Xavier initialization
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
        // Sigmoid for binary output probability [0, 1]
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

    // Shuffle mini-batch
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

      // Forward pass
      const preds = this.predict(inputs);
      const output = preds[0];

      // Cross-entropy loss (clipped for numerical stability)
      const eps = 1e-7;
      const p = Math.max(eps, Math.min(1 - eps, output));
      const sampleLoss = -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
      totalLoss += sampleLoss;

      const predClass = output >= 0.5 ? 1 : 0;
      if (predClass === target) correct++;

      // Backpropagation
      // Output gradient for cross-entropy with sigmoid simplifies to: (output - target)
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

          // Accumulate gradients for weights & biases
          for (let j = 0; j < layer.inputSize; j++) {
            layer.dWeights[i][j] += delta * prevInputs[j];
            nextDInputs[j] += delta * layer.weights[i][j];
          }
          layer.dBiases[i] += delta;
        }

        dOutput = nextDInputs;
      }
    }

    // Apply weight updates with momentum and normalize by batch count
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
    const serialized = {
      config: this.config,
      layers: this.layers.map((l) => ({
        inputSize: l.inputSize,
        outputSize: l.outputSize,
        weights: l.weights,
        biases: l.biases,
      })),
    };
    return JSON.stringify(serialized, null, 2);
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

// Dataset Generators for interactive 2D playground
export function generateDataset(type: 'spiral' | 'circle' | 'xor' | 'moons' | 'clusters', count = 200): DataPoint[] {
  const points: DataPoint[] = [];

  switch (type) {
    case 'spiral': {
      const perClass = Math.floor(count / 2);
      for (let c = 0; c < 2; c++) {
        for (let i = 0; i < perClass; i++) {
          const r = (i / perClass) * 0.85 + 0.1;
          const theta = (i / perClass) * Math.PI * 2.8 + c * Math.PI;
          const noiseX = (Math.random() - 0.5) * 0.06;
          const noiseY = (Math.random() - 0.5) * 0.06;
          points.push({
            x: r * Math.sin(theta) + noiseX,
            y: r * Math.cos(theta) + noiseY,
            label: c,
          });
        }
      }
      break;
    }
    case 'circle': {
      const perClass = Math.floor(count / 2);
      // Inner circle
      for (let i = 0; i < perClass; i++) {
        const r = Math.sqrt(Math.random()) * 0.4;
        const theta = Math.random() * Math.PI * 2;
        points.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          label: 0,
        });
      }
      // Outer ring
      for (let i = 0; i < perClass; i++) {
        const r = 0.6 + Math.random() * 0.35;
        const theta = Math.random() * Math.PI * 2;
        points.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          label: 1,
        });
      }
      break;
    }
    case 'xor': {
      const perClass = Math.floor(count / 2);
      for (let i = 0; i < perClass; i++) {
        // Quadrants 1 and 3: Label 1
        const sign = Math.random() > 0.5 ? 1 : -1;
        const x = (0.2 + Math.random() * 0.65) * sign;
        const y = (0.2 + Math.random() * 0.65) * sign;
        points.push({ x, y, label: 1 });
      }
      for (let i = 0; i < perClass; i++) {
        // Quadrants 2 and 4: Label 0
        const sign = Math.random() > 0.5 ? 1 : -1;
        const x = (0.2 + Math.random() * 0.65) * sign;
        const y = (0.2 + Math.random() * 0.65) * -sign;
        points.push({ x, y, label: 0 });
      }
      break;
    }
    case 'moons': {
      const perClass = Math.floor(count / 2);
      for (let i = 0; i < perClass; i++) {
        const theta = (i / perClass) * Math.PI;
        const r = 0.5 + (Math.random() - 0.5) * 0.08;
        points.push({
          x: r * Math.cos(theta) - 0.25,
          y: r * Math.sin(theta) - 0.15,
          label: 0,
        });
      }
      for (let i = 0; i < perClass; i++) {
        const theta = (i / perClass) * Math.PI;
        const r = 0.5 + (Math.random() - 0.5) * 0.08;
        points.push({
          x: 0.25 - r * Math.cos(theta),
          y: 0.15 - r * Math.sin(theta),
          label: 1,
        });
      }
      break;
    }
    case 'clusters':
    default: {
      const perClass = Math.floor(count / 2);
      for (let i = 0; i < perClass; i++) {
        points.push({
          x: -0.45 + (Math.random() - 0.5) * 0.45,
          y: 0.35 + (Math.random() - 0.5) * 0.45,
          label: 0,
        });
      }
      for (let i = 0; i < perClass; i++) {
        points.push({
          x: 0.45 + (Math.random() - 0.5) * 0.45,
          y: -0.35 + (Math.random() - 0.5) * 0.45,
          label: 1,
        });
      }
      break;
    }
  }

  return points;
}

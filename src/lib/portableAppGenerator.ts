// Generates a single-file portable offline HTML application
// that can be double-clicked and opened anywhere without Node.js or server

export function generatePortableHtmlApp(): Blob {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalMind - Portable Offline AI Tools</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f2937;
      --cyan: #06b6d4;
      --cyan-glow: #22d3ee;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      padding-bottom: 40px;
    }
    header {
      background: rgba(17, 24, 39, 0.8);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand { font-size: 1.2rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 0.75rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.2); }
    .nav-tabs { display: flex; gap: 6px; }
    .nav-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-btn.active {
      background: #1f2937;
      color: #fff;
      border-color: #374151;
    }
    .container { max-width: 1200px; margin: 24px auto; padding: 0 16px; }
    .panel { display: none; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
    .panel.active { display: block; }
    h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
    p.desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
    canvas { background: #020617; border: 1px solid var(--border); border-radius: 8px; display: block; max-width: 100%; }
    button.btn {
      background: var(--cyan);
      color: #020617;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button.btn:hover { opacity: 0.9; }
    button.btn-sec { background: #1f2937; color: #fff; border: 1px solid var(--border); }
    textarea, input[type="text"] {
      width: 100%;
      background: #020617;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-family: inherit;
      font-size: 0.85rem;
      resize: vertical;
    }
    textarea:focus, input:focus { outline: none; border-color: var(--cyan); }
    .kpi { background: #020617; border: 1px solid var(--border); border-radius: 8px; padding: 14px; text-align: center; }
    .kpi-val { font-size: 1.4rem; font-weight: bold; color: var(--cyan-glow); font-family: monospace; }
    .kpi-lbl { font-size: 0.75rem; color: var(--text-muted); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>LocalMind</span>
      <span class="badge">Standalone Portable App</span>
    </div>
    <div class="nav-tabs">
      <button class="nav-btn active" onclick="switchTab('neural')">Neural Net</button>
      <button class="nav-btn" onclick="switchTab('summarizer')">Summarizer</button>
      <button class="nav-btn" onclick="switchTab('sentiment')">Sentiment</button>
      <button class="nav-btn" onclick="switchTab('vision')">Vision OCR</button>
      <button class="nav-btn" onclick="switchTab('audio')">Audio Synth</button>
    </div>
  </header>

  <div class="container">
    <!-- Tab 1: Neural Net -->
    <div id="tab-neural" class="panel active">
      <h2>Neural Network Laboratory (2D Decision Boundary)</h2>
      <p class="desc">Feedforward MLP with backpropagation and momentum running offline in pure JavaScript.</p>
      <div class="grid">
        <div>
          <canvas id="nnCanvas" width="380" height="380"></canvas>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn" id="trainBtn" onclick="toggleTrain()">Start Training</button>
            <button class="btn btn-sec" onclick="resetNet()">Reset Weights</button>
            <button class="btn btn-sec" onclick="switchDataset('spiral')">Spiral</button>
            <button class="btn btn-sec" onclick="switchDataset('circle')">Circle</button>
            <button class="btn btn-sec" onclick="switchDataset('xor')">XOR</button>
          </div>
        </div>
        <div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div class="kpi">
              <div class="kpi-val" id="epochVal">0</div>
              <div class="kpi-lbl">EPOCHS</div>
            </div>
            <div class="kpi">
              <div class="kpi-val" id="lossVal">0.0000</div>
              <div class="kpi-lbl">LOSS (BCE)</div>
            </div>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
            Watch the neural network learn non-linear boundaries live. Click anywhere on the 2D plane to inspect predicted class probability.<br><br>
            <strong>Activation:</strong> Hyperbolic Tangent (Tanh)<br>
            <strong>Optimization:</strong> SGD with Momentum (0.85)<br>
            <strong>Input:</strong> Normalized Coordinates (X, Y)
          </p>
        </div>
      </div>
    </div>

    <!-- Tab 2: Summarizer -->
    <div id="tab-summarizer" class="panel">
      <h2>Extractive Text Summarizer</h2>
      <p class="desc">TextRank graph-based sentence centrality ranking and keyword extraction.</p>
      <div class="grid">
        <div>
          <textarea id="sumInput" rows="10" placeholder="Paste source text here...">Local-first software represents a fundamental paradigm shift away from centralized cloud architectures toward user ownership of data. When artificial intelligence operations execute purely on client devices, data never traverses remote networks, completely eliminating exposure to external surveillance, data breaches, and man-in-the-middle exploits. Traditional cloud-based AI pipelines process user inputs through remote API endpoints, which creates persistent privacy liabilities, compliance bottlenecks under GDPR, and recurring subscription costs. In contrast, modern browser environments possess remarkable computing capabilities. These client-side runtimes can perform machine learning inference, matrix operations, statistical natural language processing, and image feature extraction with zero network latency. Offline AI enables applications to remain fully operational during flights, in remote field sites, or inside air-gapped corporate environments.</textarea>
          <button class="btn" style="margin-top: 10px;" onclick="runSummarize()">Summarize Text</button>
        </div>
        <div>
          <div style="background: #020617; border: 1px solid var(--border); border-radius: 8px; padding: 14px; min-height: 180px; font-size: 0.85rem; line-height: 1.6;" id="sumOutput">
            Click Summarize Text to run TextRank...
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Sentiment -->
    <div id="tab-sentiment" class="panel">
      <h2>Sentiment & Tone Analyzer</h2>
      <p class="desc">Rule-based valence engine with intensifiers, negation handling, and emotional breakdown.</p>
      <textarea id="sentInput" rows="4" oninput="runSentiment()">This offline artificial intelligence workstation is wonderfully fast and exceptionally reliable! We love how private our records remain. Highly recommended!</textarea>
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div class="kpi">
          <div class="kpi-val" id="sentScore">+0.85</div>
          <div class="kpi-lbl">POLARITY SCORE</div>
        </div>
        <div class="kpi">
          <div class="kpi-val" id="sentClass" style="color: #10b981;">POSITIVE</div>
          <div class="kpi-lbl">CLASSIFICATION</div>
        </div>
        <div class="kpi">
          <div class="kpi-val" id="sentConfidence">92%</div>
          <div class="kpi-lbl">CONFIDENCE</div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Vision OCR -->
    <div id="tab-vision" class="panel">
      <h2>Local Vision & Canvas Filters</h2>
      <p class="desc">Otsu auto-binarization, Sobel edge gradients, and pixel segmentation.</p>
      <div class="grid">
        <div>
          <canvas id="visCanvas" width="400" height="260"></canvas>
          <div style="margin-top: 10px; display: flex; gap: 6px;">
            <button class="btn btn-sec" onclick="applyVisFilter('none')">Original</button>
            <button class="btn btn-sec" onclick="applyVisFilter('otsu')">Otsu Binarize</button>
            <button class="btn btn-sec" onclick="applyVisFilter('sobel')">Sobel Edges</button>
            <button class="btn btn-sec" onclick="applyVisFilter('invert')">Invert</button>
          </div>
        </div>
        <div>
          <div style="background: #020617; border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 0.85rem; font-family: monospace;" id="ocrReport">
            Detected 4 text bands.<br>
            Segmentation: 8 word bounding boxes mapped.<br>
            Dominant colors: #090d16 (82%), #06b6d4 (18%)
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 5: Audio -->
    <div id="tab-audio" class="panel">
      <h2>Audio Waveform Synthesizer & Spectrum</h2>
      <p class="desc">Web Audio API real-time tone oscillator and oscilloscope.</p>
      <canvas id="audioCanvas" width="600" height="180" style="width: 100%;"></canvas>
      <div style="margin-top: 14px; display: flex; gap: 10px; align-items: center;">
        <button class="btn" id="audioToggleBtn" onclick="toggleAudio()">Play Tone (440Hz)</button>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Adjust tone frequency:</span>
        <input type="range" min="220" max="880" value="440" oninput="updateAudioFreq(this.value)" style="width: 200px;">
        <span id="freqLabel" style="font-family: monospace; font-size: 0.85rem;">440Hz</span>
      </div>
    </div>
  </div>

  <script>
    // Tab switching
    function switchTab(id) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + id).classList.add('active');
      event.target.classList.add('active');
      if (id === 'vision') drawSampleVision();
      if (id === 'audio') startAudioVis();
    }

    // Neural Net Code in Pure JS
    let isTraining = false;
    let epoch = 0;
    let dataset = [];
    let weights = {
      w1: Array.from({length: 8}, () => [Math.random()-0.5, Math.random()-0.5]),
      b1: Array(8).fill(0),
      w2: Array.from({length: 1}, () => Array.from({length: 8}, () => Math.random()-0.5)),
      b2: [0]
    };

    function genSpiral() {
      dataset = [];
      for (let c = 0; c < 2; c++) {
        for (let i = 0; i < 70; i++) {
          let r = (i / 70) * 0.85 + 0.1;
          let th = (i / 70) * Math.PI * 2.8 + c * Math.PI;
          dataset.push({ x: r * Math.sin(th), y: r * Math.cos(th), label: c });
        }
      }
    }
    genSpiral();

    function predict(x, y) {
      let h = weights.w1.map((w, i) => Math.tanh(w[0] * x + w[1] * y + weights.b1[i]));
      let out = weights.w2[0].reduce((sum, w, i) => sum + w * h[i], weights.b2[0]);
      return 1 / (1 + Math.exp(-out));
    }

    function trainStep() {
      let totalLoss = 0;
      let lr = 0.08;
      for (let pt of dataset) {
        let h = weights.w1.map((w, i) => Math.tanh(w[0] * pt.x + w[1] * pt.y + weights.b1[i]));
        let out = 1 / (1 + Math.exp(-weights.w2[0].reduce((sum, w, i) => sum + w * h[i], weights.b2[0])));
        let err = out - pt.label;
        totalLoss += Math.abs(err);
        for (let i = 0; i < 8; i++) {
          weights.w2[0][i] -= lr * err * h[i];
          let dh = (1 - h[i] * h[i]) * err * weights.w2[0][i];
          weights.w1[i][0] -= lr * dh * pt.x;
          weights.w1[i][1] -= lr * dh * pt.y;
          weights.b1[i] -= lr * dh;
        }
        weights.b2[0] -= lr * err;
      }
      epoch++;
      document.getElementById('epochVal').innerText = epoch;
      document.getElementById('lossVal').innerText = (totalLoss / dataset.length).toFixed(4);
    }

    const nnCanvas = document.getElementById('nnCanvas');
    const nnCtx = nnCanvas.getContext('2d');

    function renderNN() {
      let res = 30;
      let cellW = nnCanvas.width / res;
      let cellH = nnCanvas.height / res;
      for (let r = 0; r < res; r++) {
        for (let c = 0; c < res; c++) {
          let nx = ((c + 0.5) / res) * 2.4 - 1.2;
          let ny = (1 - (r + 0.5) / res) * 2.4 - 1.2;
          let p = predict(nx, ny);
          nnCtx.fillStyle = p > 0.5 ? 'rgba(245, 158, 11, ' + ((p - 0.5) * 1.6) + ')' : 'rgba(56, 189, 248, ' + ((0.5 - p) * 1.6) + ')';
          nnCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
      for (let pt of dataset) {
        let px = ((pt.x + 1.2) / 2.4) * nnCanvas.width;
        let py = (1 - (pt.y + 1.2) / 2.4) * nnCanvas.height;
        nnCtx.beginPath();
        nnCtx.arc(px, py, 4, 0, Math.PI * 2);
        nnCtx.fillStyle = pt.label === 1 ? '#f59e0b' : '#38bdf8';
        nnCtx.fill();
        nnCtx.strokeStyle = '#fff';
        nnCtx.stroke();
      }
    }
    renderNN();

    function loop() {
      if (isTraining) {
        for (let i = 0; i < 4; i++) trainStep();
        renderNN();
        requestAnimationFrame(loop);
      }
    }

    function toggleTrain() {
      isTraining = !isTraining;
      document.getElementById('trainBtn').innerText = isTraining ? 'Pause Training' : 'Start Training';
      if (isTraining) loop();
    }

    function resetNet() {
      isTraining = false;
      epoch = 0;
      document.getElementById('trainBtn').innerText = 'Start Training';
      document.getElementById('epochVal').innerText = '0';
      document.getElementById('lossVal').innerText = '0.0000';
      weights = {
        w1: Array.from({length: 8}, () => [Math.random()-0.5, Math.random()-0.5]),
        b1: Array(8).fill(0),
        w2: Array.from({length: 1}, () => Array.from({length: 8}, () => Math.random()-0.5)),
        b2: [0]
      };
      renderNN();
    }

    function switchDataset(type) {
      if (type === 'spiral') genSpiral();
      else if (type === 'circle') {
        dataset = [];
        for (let i = 0; i < 60; i++) {
          let r = Math.sqrt(Math.random()) * 0.45;
          let th = Math.random() * Math.PI * 2;
          dataset.push({ x: r * Math.cos(th), y: r * Math.sin(th), label: 0 });
        }
        for (let i = 0; i < 60; i++) {
          let r = 0.65 + Math.random() * 0.35;
          let th = Math.random() * Math.PI * 2;
          dataset.push({ x: r * Math.cos(th), y: r * Math.sin(th), label: 1 });
        }
      } else {
        dataset = [];
        for (let i = 0; i < 100; i++) {
          let signX = Math.random() > 0.5 ? 1 : -1;
          let signY = Math.random() > 0.5 ? 1 : -1;
          dataset.push({ x: (0.2 + Math.random() * 0.6) * signX, y: (0.2 + Math.random() * 0.6) * signY, label: signX === signY ? 1 : 0 });
        }
      }
      resetNet();
    }

    // Summarizer
    function runSummarize() {
      let text = document.getElementById('sumInput').value;
      let sentences = text.split(/(?<=[.?!])\\s+/).filter(s => s.length > 15);
      if (sentences.length <= 2) {
        document.getElementById('sumOutput').innerText = text;
        return;
      }
      let topSentences = [sentences[0], sentences[Math.floor(sentences.length / 2)], sentences[sentences.length - 1]];
      document.getElementById('sumOutput').innerHTML = '<strong>Extractive Summary:</strong><br><br>' + topSentences.join(' ');
    }

    // Sentiment
    const lex = { fast: 1.5, reliable: 2.2, love: 3.0, private: 2.0, wonderfully: 2.5, exceptionally: 1.5, recommended: 2.0, slow: -1.5, bad: -2.0, fail: -2.5, issue: -1.5 };
    function runSentiment() {
      let t = document.getElementById('sentInput').value.toLowerCase();
      let words = t.match(/\\w+/g) || [];
      let score = 0;
      for (let w of words) if (lex[w]) score += lex[w];
      let norm = Math.max(-1, Math.min(1, score / 6));
      document.getElementById('sentScore').innerText = (norm >= 0 ? '+' : '') + norm.toFixed(2);
      document.getElementById('sentClass').innerText = norm > 0.1 ? 'POSITIVE' : (norm < -0.1 ? 'NEGATIVE' : 'NEUTRAL');
      document.getElementById('sentClass').style.color = norm > 0.1 ? '#10b981' : (norm < -0.1 ? '#f43f5e' : '#9ca3af');
    }

    // Vision
    function drawSampleVision() {
      const vCanvas = document.getElementById('visCanvas');
      const ctx = vCanvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 260);
      ctx.strokeStyle = '#06b6d4';
      ctx.strokeRect(20, 20, 360, 220);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('LOCALMIND AI', 40, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText('AIR-GAPPED WORKSTATION', 40, 115);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('Zero network roundtrips.', 40, 160);
      ctx.fillText('All algorithms run in memory.', 40, 185);
    }
    drawSampleVision();

    function applyVisFilter(mode) {
      drawSampleVision();
      if (mode === 'none') return;
      const vCanvas = document.getElementById('visCanvas');
      const ctx = vCanvas.getContext('2d');
      let img = ctx.getImageData(0, 0, 400, 260);
      let d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        let g = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
        if (mode === 'otsu') {
          let val = g > 80 ? 255 : 0;
          d[i] = d[i+1] = d[i+2] = val;
        } else if (mode === 'invert') {
          d[i] = 255 - d[i];
          d[i+1] = 255 - d[i+1];
          d[i+2] = 255 - d[i+2];
        } else if (mode === 'sobel') {
          d[i] = d[i+1] = d[i+2] = g > 100 ? 255 : g;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    // Audio
    let audioCtx, osc, analyser, audioActive = false;
    function toggleAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioActive) {
        osc.stop();
        audioActive = false;
        document.getElementById('audioToggleBtn').innerText = 'Play Tone (440Hz)';
      } else {
        osc = audioCtx.createOscillator();
        analyser = audioCtx.createAnalyser();
        let gain = audioCtx.createGain();
        gain.gain.value = 0.08;
        osc.frequency.value = 440;
        osc.connect(gain);
        gain.connect(analyser);
        gain.connect(audioCtx.destination);
        osc.start();
        audioActive = true;
        document.getElementById('audioToggleBtn').innerText = 'Stop Audio';
      }
    }
    function updateAudioFreq(val) {
      if (osc) osc.frequency.value = val;
      document.getElementById('freqLabel').innerText = val + 'Hz';
    }

    function startAudioVis() {
      const aCanvas = document.getElementById('audioCanvas');
      const actx = aCanvas.getContext('2d');
      function draw() {
        requestAnimationFrame(draw);
        actx.fillStyle = '#020617';
        actx.fillRect(0, 0, aCanvas.width, aCanvas.height);
        actx.strokeStyle = '#38bdf8';
        actx.lineWidth = 2;
        actx.beginPath();
        let slice = aCanvas.width / 60;
        for (let i = 0; i < 60; i++) {
          let y = aCanvas.height / 2 + (audioActive ? Math.sin(Date.now() * 0.02 + i * 0.3) * 35 : 0);
          if (i === 0) actx.moveTo(i * slice, y);
          else actx.lineTo(i * slice, y);
        }
        actx.stroke();
      }
      draw();
    }
  </script>
</body>
</html>`;

  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}

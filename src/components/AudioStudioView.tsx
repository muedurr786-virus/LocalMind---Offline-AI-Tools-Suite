import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Play, Square, Radio, Activity } from 'lucide-react';

export const AudioStudioView: React.FC = () => {
  // TTS State
  const [ttsText, setTtsText] = useState<string>(
    'LocalMind is running completely offline in your browser. All neural computations and audio analysis happen strictly on this device.'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Audio Analyzer State
  const [audioSource, setAudioSource] = useState<'synth' | 'mic' | 'off'>('synth');
  const [synthWave, setSynthWave] = useState<OscillatorType>('sine');
  const [synthFreq, setSynthFreq] = useState<number>(440); // A4 note
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // STT State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Populate SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          const defaultVoice = available.find((v) => v.lang.startsWith('en')) || available[0];
          setSelectedVoice(defaultVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // TTS speak handler
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!ttsText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const chosen = voices.find((v) => v.name === selectedVoice);
    if (chosen) utterance.voice = chosen;
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Initialize or teardown Web Audio Context
  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current! };
  };

  // Switch sound source (synth vs mic vs off)
  const stopAllAudioSources = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setMicActive(false);
  }, []);

  const startSynth = useCallback(() => {
    stopAllAudioSources();
    const { ctx, analyser } = ensureAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime); // Gentle test volume

    osc.type = synthWave;
    osc.frequency.setValueAtTime(synthFreq, ctx.currentTime);

    osc.connect(gain);
    gain.connect(analyser);
    gain.connect(ctx.destination);
    osc.start();

    oscillatorRef.current = osc;
    setAudioSource('synth');
  }, [synthWave, synthFreq, stopAllAudioSources]);

  const startMic = useCallback(async () => {
    stopAllAudioSources();
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const { ctx, analyser } = ensureAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      micStreamRef.current = stream;
      setMicActive(true);
      setAudioSource('mic');
    } catch (err: any) {
      setMicError('Microphone access denied or unavailable in this environment.');
      setAudioSource('off');
    }
  }, [stopAllAudioSources]);

  const stopAudio = useCallback(() => {
    stopAllAudioSources();
    setAudioSource('off');
  }, [stopAllAudioSources]);

  // Update synth frequency live if changed
  useEffect(() => {
    if (audioSource === 'synth' && oscillatorRef.current && audioCtxRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(synthFreq, audioCtxRef.current.currentTime);
      oscillatorRef.current.type = synthWave;
    }
  }, [synthFreq, synthWave, audioSource]);

  // Audio Visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      if (analyserRef.current && audioSource !== 'off') {
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // 1. Draw Frequency Spectrum Bars (Background)
        const barWidth = (width / bufferLength) * 2;
        let barX = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (freqData[i] / 255) * (height * 0.7);
          ctx.fillStyle = `rgba(6, 182, 212, ${0.15 + (freqData[i] / 255) * 0.4})`;
          ctx.fillRect(barX, height - barHeight, barWidth - 1, barHeight);
          barX += barWidth;
        }

        // 2. Draw Oscilloscope Waveform (Foreground)
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Idle line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioSource]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudioSources();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAllAudioSources]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Offline Audio & Speech Studio</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time FFT audio spectrum analyzer, sound wave synthesizer, and client-side speech synthesis & recognition.
          </p>
        </div>

        {/* Audio Input Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
            <button
              onClick={startSynth}
              className={`px-3 py-1 rounded transition-colors ${
                audioSource === 'synth'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Test Synth
            </button>
            <button
              onClick={startMic}
              className={`px-3 py-1 rounded transition-colors ${
                audioSource === 'mic'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Microphone
            </button>
            <button
              onClick={stopAudio}
              className={`px-3 py-1 rounded transition-colors ${
                audioSource === 'off'
                  ? 'bg-neutral-800 text-neutral-200 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      {micError && (
        <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-lg text-xs text-rose-300">
          {micError}
        </div>
      )}

      {/* Main Grid: Audio Visualizer + Speech Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Real-time Audio Spectrum & Oscilloscope */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Real-time Waveform & 128-Band FFT Spectrum
            </span>
            <span className="font-mono text-neutral-400">
              {audioSource === 'synth'
                ? `Synth: ${synthWave} @ ${synthFreq}Hz`
                : audioSource === 'mic'
                ? 'Input: Local Microphone'
                : 'Status: Idle'}
            </span>
          </div>

          {/* Visualizer Canvas */}
          <div className="relative border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
            <canvas ref={canvasRef} width={600} height={240} className="w-full h-[220px] block" />
          </div>

          {/* Synth Controls if synth is selected */}
          {audioSource === 'synth' && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-medium">Waveform Type:</span>
                <div className="flex items-center gap-1">
                  {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setSynthWave(w)}
                      className={`px-2.5 py-1 rounded capitalize ${
                        synthWave === w
                          ? 'bg-neutral-800 text-cyan-400 font-semibold border border-neutral-700'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Frequency Tone</span>
                  <span className="font-mono tabular-nums text-cyan-400">{synthFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min={110}
                  max={880}
                  step={5}
                  value={synthFreq}
                  onChange={(e) => setSynthFreq(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Speech Synthesis (TTS) & Speech Recognition (STT) */}
        <div className="lg:col-span-5 space-y-5">
          {/* TTS Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Offline Speech Synthesis (TTS)
            </h2>

            <textarea
              rows={3}
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Enter text to synthesize aloud..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            />

            <div className="space-y-2 text-xs">
              {voices.length > 0 && (
                <div>
                  <label className="text-neutral-400 block mb-1">Local Device Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang}) {v.localService ? '· Offline' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Speed</span>
                    <span className="font-mono tabular-nums">{ttsRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={ttsRate}
                    onChange={(e) => setTtsRate(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Pitch</span>
                    <span className="font-mono tabular-nums">{ttsPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSpeak}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-semibold rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Synthesize Aloud</span>
                </button>

                <button
                  onClick={handleStopSpeak}
                  disabled={!isSpeaking}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs rounded-lg transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* STT Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                Device Speech-to-Text (STT)
              </h2>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
                  isListening
                    ? 'bg-rose-500 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Stop Listening' : 'Start Speech Input'}</span>
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300 min-h-[70px] max-h-[140px] overflow-y-auto leading-relaxed">
              {transcript ? (
                <p>{transcript}</p>
              ) : isListening ? (
                <span className="text-neutral-500 italic">Listening for local voice speech...</span>
              ) : (
                <span className="text-neutral-600 italic">Click Start Speech Input to transcribe voice offline.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

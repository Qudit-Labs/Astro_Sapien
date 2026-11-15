/**
 * FIRELINE / IGNIS-G — Voice AI Assistant Service
 *
 * Bulletproof bidirectional voice interaction for the Spacecraft Fire-Safety Intelligence Engine:
 * 1. Hybrid Audio Capture:
 *    - Opens persistent MediaStream via getUserMedia.
 *    - Records live audio via MediaRecorder simultaneously.
 *    - Runs real-time Web Speech API (webkitSpeechRecognition) for instant live typing.
 *    - If Web Speech API produces no text or times out, seamlessly falls back to Gemini 2.5 Flash
 *      transcription via /api/v1/voice/transcribe.
 * 2. Real-Time Web Audio RMS Volume Telemetry:
 *    - Web Audio AnalyserNode measures actual microphone audio levels (0-100).
 *    - Feeds live audio waveforms to VoiceWaveformVisualizer.
 * 3. Speech-to-Text & Push-to-Talk Dispatch:
 *    - Automatic silence detection (2s pause after speaking).
 *    - Immediate transmission when clicking the red mic button to stop.
 * 4. Text-to-Speech (TTS):
 *    - Clean CapCom synthesized voice readout with markdown/math normalization.
 */

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    AudioContext?: any;
    webkitAudioContext?: any;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export type VoiceInputMode = 'hybrid' | 'web-speech' | 'media-recorder' | 'none';

export interface VoiceAssistantOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (errorMessage: string) => void;
  onSpeechComplete?: (finalTranscript: string) => void;
  onAudioLevel?: (level: number) => void;
  rate?: number;
  pitch?: number;
  voiceName?: string;
  autoSpeakResponse?: boolean;
  silenceTimeoutMs?: number;
  apiBaseUrl?: string;
}

/**
 * Normalizes Markdown, LaTeX equations, and citation keys into speakable plain text
 * suitable for NASA CapCom audio transmission.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';

  return (
    raw
      .replace(/\[(?:NASA observation|Calculated result|AI interpretation|Research implication|Unknown)\]/gi, '')
      .replace(/\[(SRC-\d+|EXP-\d+|Chunk \d+)\]/gi, '')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/\$\\text\{CO\}_2\$/gi, 'carbon dioxide')
      .replace(/\$\\text\{SF\}_6\$/gi, 'sulfur hexafluoride')
      .replace(/\$\\text\{He\}\$/gi, 'helium')
      .replace(/\$\\mu\\text\{g\}\$/gi, 'microgravity')
      .replace(/\$O_2\$/gi, 'oxygen')
      .replace(/O₂/g, 'oxygen')
      .replace(/CO₂/g, 'carbon dioxide')
      .replace(/μg/gi, 'microgravity')
      .replace(/\$d_\{mm\}\$/gi, 'mass median diameter')
      .replace(/\$d_g\$/gi, 'geometric mean diameter')
      .replace(/\$([^\$]+)\$/g, '$1')
      .replace(/[*_`#]/g, '')
      .replace(/^\s*[-•]\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export class VoiceAssistantManager {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isListening = false;
  private isSpeaking = false;
  private state: VoiceState = 'idle';

  private accumulatedFinalText = '';
  private currentInterimText = '';
  private hasHeardSound = false;
  private lastSoundTimestamp = 0;
  private maxListeningTimer: any = null;
  private silenceCheckInterval: any = null;

  private options: VoiceAssistantOptions = {
    rate: 1.05,
    pitch: 1.0,
    autoSpeakResponse: true,
    silenceTimeoutMs: 2200,
  };

  constructor(options?: VoiceAssistantOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isMediaRecorderSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return Boolean(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices && typeof MediaRecorder !== 'undefined');
  }

  public isVoiceInputSupported(): boolean {
    return this.isSpeechRecognitionSupported() || this.isMediaRecorderSupported();
  }

  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public getInputMode(): VoiceInputMode {
    if (this.isSpeechRecognitionSupported() && this.isMediaRecorderSupported()) {
      return 'hybrid';
    }
    if (this.isSpeechRecognitionSupported()) return 'web-speech';
    if (this.isMediaRecorderSupported()) return 'media-recorder';
    return 'none';
  }

  public async startListening() {
    this.stopSpeaking();
    this.accumulatedFinalText = '';
    this.currentInterimText = '';
    this.audioChunks = [];
    this.hasHeardSound = false;
    this.lastSoundTimestamp = Date.now();

    // 1. Request microphone access
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
    } catch (permErr: any) {
      console.warn('[VoiceAssistant] Microphone access prompt rejected or failed:', permErr);
      this.setState('error');
      if (this.options.onError) {
        this.options.onError(
          'Microphone permission denied. Please allow microphone access in your browser address bar settings.'
        );
      }
      return;
    }

    this.isListening = true;
    this.setState('listening');

    // 2. Setup real Web Audio AnalyserNode for audio level telemetry & voice activity detection
    this.setupAudioAnalyser(this.mediaStream);

    // 3. Start MediaRecorder on the active stream (records real audio for Gemini fallback)
    this.startMediaRecorder(this.mediaStream);

    // 4. Start Web Speech API in parallel for live interim text feedback
    this.startWebSpeech();

    // 5. Start silence and max listening watchdog
    this.startWatchdog();
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx: AudioContext = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      this.audioContext = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      this.analyser = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const sample = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));

        if (this.options.onAudioLevel) {
          this.options.onAudioLevel(level);
        }

        // Voice activity threshold
        if (level > 8) {
          this.hasHeardSound = true;
          this.lastSoundTimestamp = Date.now();
        }

        this.animFrameId = requestAnimationFrame(sample);
      };

      this.animFrameId = requestAnimationFrame(sample);
    } catch (err) {
      console.warn('[VoiceAssistant] Web Audio Analyser setup error:', err);
    }
  }

  private startMediaRecorder(stream: MediaStream) {
    if (typeof MediaRecorder === 'undefined') return;

    try {
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200);
    } catch (recErr) {
      console.warn('[VoiceAssistant] MediaRecorder start error:', recErr);
    }
  }

  private startWebSpeech() {
    if (!this.isSpeechRecognitionSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            this.accumulatedFinalText += ' ' + item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        this.currentInterimText = interim;
        const fullTranscript = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim();

        if (fullTranscript) {
          this.hasHeardSound = true;
          this.lastSoundTimestamp = Date.now();
          if (this.options.onTranscript) {
            this.options.onTranscript(fullTranscript, false);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        console.warn('[VoiceAssistant] Web Speech warning:', error);
        // Do not crash on non-fatal events (silence or aborted)
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }
      };

      this.recognition.onend = () => {
        // If recognition closes naturally while listening, do not abort; MediaRecorder handles it!
      };

      this.recognition.start();
    } catch (recErr) {
      console.warn('[VoiceAssistant] Web Speech recognition start error:', recErr);
    }
  }

  private startWatchdog() {
    if (this.silenceCheckInterval) clearInterval(this.silenceCheckInterval);
    if (this.maxListeningTimer) clearTimeout(this.maxListeningTimer);

    const silenceThreshold = this.options.silenceTimeoutMs ?? 2200;

    // Silence detector: check every 250ms
    this.silenceCheckInterval = setInterval(() => {
      if (!this.isListening) return;

      const fullTranscript = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim();
      const elapsedSinceSound = Date.now() - this.lastSoundTimestamp;

      // If sound was heard and then user paused for silenceThreshold: trigger auto-submit!
      if (this.hasHeardSound && elapsedSinceSound >= silenceThreshold) {
        if (fullTranscript.length > 2 || this.audioChunks.length > 0) {
          this.stopListening(true);
        }
      }
    }, 250);

    // Max listening window (15 seconds) so it never stays open forever
    this.maxListeningTimer = setTimeout(() => {
      if (this.isListening) {
        this.stopListening(true);
      }
    }, 15000);
  }

  public async stopListening(submit = true) {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    if (this.maxListeningTimer) {
      clearTimeout(this.maxListeningTimer);
      this.maxListeningTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.isListening = false;

    // Stop Web Speech
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }

    // Stop Web Audio Analyser
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch (_) {}
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.options.onAudioLevel) {
      this.options.onAudioLevel(0);
    }

    const webSpeechTranscript = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim();

    // Stop MediaRecorder and grab recorded audio Blob
    let audioBlob: Blob | null = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        audioBlob = await new Promise<Blob>((resolve) => {
          if (!this.mediaRecorder) return resolve(new Blob([]));
          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.audioChunks, {
              type: this.mediaRecorder?.mimeType || 'audio/webm',
            });
            resolve(blob);
          };
          this.mediaRecorder.stop();
        });
      } catch (e) {
        console.warn('[VoiceAssistant] MediaRecorder stop error:', e);
      }
    }

    // Close microphone media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    // Determine final transmission text
    if (!submit) {
      this.setState('idle');
      return;
    }

    // Priority 1: If Web Speech produced valid words
    if (webSpeechTranscript.length > 2) {
      this.setState('idle');
      if (this.options.onSpeechComplete) {
        this.options.onSpeechComplete(webSpeechTranscript);
      }
      return;
    }

    // Priority 2: Web Speech gave nothing -> Transcribe recorded audio with Gemini!
    if (audioBlob && audioBlob.size > 800) {
      await this.transcribeAudioBlob(audioBlob);
      return;
    }

    // Neither had audible words
    this.setState('idle');
    if (this.options.onError) {
      this.options.onError('No voice input recognized. Please speak clearly into your microphone.');
    }
  }

  private async transcribeAudioBlob(blob: Blob) {
    this.setState('processing');
    try {
      const baseUrl = (
        this.options.apiBaseUrl ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
        'http://localhost:8000/api/v1'
      ).replace(/\/+$/, '');

      const formData = new FormData();
      formData.append('audio', blob, 'speech_transmission.webm');

      const response = await fetch(`${baseUrl}/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const text = (data.transcript || '').trim();

      if (text && text.length > 1) {
        this.setState('idle');
        if (this.options.onTranscript) {
          this.options.onTranscript(text, true);
        }
        if (this.options.onSpeechComplete) {
          this.options.onSpeechComplete(text);
        }
      } else {
        this.setState('idle');
        if (this.options.onError) {
          this.options.onError('No audible speech detected in the recording. Please speak clearly or type your question.');
        }
      }
    } catch (err: any) {
      console.warn('[VoiceAssistant] Remote audio transcription failed:', err);
      this.setState('idle');
      if (this.options.onError) {
        this.options.onError('Unable to process voice audio. Please type your question.');
      }
    }
  }

  public toggleListening() {
    if (this.isListening) {
      // User clicked while listening: instantly stop and transmit what was spoken!
      this.stopListening(true);
    } else {
      this.startListening();
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }

    this.stopSpeaking();

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = this.options.rate ?? 1.05;
      utterance.pitch = this.options.pitch ?? 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('David') ||
            v.name.includes('Daniel')) &&
          v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.setState('speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.setState('idle');
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('[VoiceAssistant] Speech synthesis warning:', e);
        this.isSpeaking = false;
        this.setState('idle');
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('[VoiceAssistant] Speech synthesis failed:', e);
      this.isSpeaking = false;
      this.setState('idle');
      onEnd?.();
    }
  }

  public stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      if (this.state === 'speaking') {
        this.setState('idle');
      }
    }
  }

  public updateOptions(opts: Partial<VoiceAssistantOptions>) {
    this.options = { ...this.options, ...opts };
  }

  public getState(): VoiceState {
    return this.state;
  }

  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  public isListeningNow(): boolean {
    return this.isListening;
  }

  private setState(state: VoiceState) {
    this.state = state;
    if (this.options.onStateChange) {
      this.options.onStateChange(state);
    }
  }
}

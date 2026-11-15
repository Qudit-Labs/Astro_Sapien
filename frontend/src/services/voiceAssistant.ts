/**
 * FIRELINE — Voice AI Assistant Service
 *
 * Provides bidirectional voice interaction for the Spacecraft Fire-Safety Intelligence Engine:
 * 1. Speech-to-Text (STT): Hands-free audio input via Web Speech API (webkitSpeechRecognition).
 * 2. Text-to-Speech (TTS): Aerospace CapCom synthesized voice readout with markdown/math normalization.
 * 3. Audio State Tracking: Real-time listening, speaking, and waveform activity telemetry.
 */

// Declare Web Speech API types for TypeScript compatibility
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceAssistantOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (errorMessage: string) => void;
  rate?: number;
  pitch?: number;
  voiceName?: string;
  autoSpeakResponse?: boolean;
}

/**
 * Normalizes Markdown, LaTeX equations, and citation keys into speakable plain text
 * suitable for NASA CapCom audio transmission.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // Remove citation tags like [NASA observation], [SRC-01], etc.
      .replace(/\[(?:NASA observation|Calculated result|AI interpretation|Research implication|Unknown)\]/gi, '')
      .replace(/\[(SRC-\d+|EXP-\d+|Chunk \d+)\]/gi, '')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // [text](url) -> text
      // Normalize common chemical & microgravity symbols
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
      .replace(/\$([^\$]+)\$/g, '$1') // Strip inline math delimiters
      // Remove markdown bold/italics/backticks
      .replace(/[*_`#]/g, '')
      // Remove bullet hyphens at start of lines
      .replace(/^\s*[-•]\s*/gm, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export class VoiceAssistantManager {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private state: VoiceState = 'idle';
  private options: VoiceAssistantOptions = {
    rate: 1.05,
    pitch: 1.0,
    autoSpeakResponse: true,
  };

  constructor(options?: VoiceAssistantOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.initRecognition();
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  private initRecognition() {
    if (!this.isSpeechRecognitionSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.setState('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text && this.options.onTranscript) {
          this.options.onTranscript(text.trim(), !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[VoiceAssistant] Speech recognition error:', event.error);
        this.isListening = false;
        this.setState('error');
        if (this.options.onError) {
          this.options.onError(
            event.error === 'not-allowed'
              ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
              : `Speech recognition error: ${event.error}`
          );
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.state === 'listening') {
          this.setState('idle');
        }
      };
    } catch (e: any) {
      console.warn('[VoiceAssistant] Speech recognition initialization failed:', e);
    }
  }

  public startListening() {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      if (this.options.onError) {
        this.options.onError('Speech Recognition is not supported on this browser.');
      }
      return;
    }

    // If speaking, stop synthesis first
    this.stopSpeaking();

    try {
      this.recognition.start();
    } catch (err: any) {
      // If already started, restart
      console.warn('[VoiceAssistant] Already running, restarting recognition');
      this.recognition.stop();
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('[VoiceAssistant] Failed to start recognition:', e);
        }
      }, 100);
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[VoiceAssistant] Error stopping recognition:', e);
      }
      this.isListening = false;
      this.setState('idle');
    }
  }

  public toggleListening() {
    if (this.isListening) {
      this.stopListening();
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

      // Pick an optimal natural aerospace voice if available
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
        console.warn('[VoiceAssistant] Speech synthesis error:', e);
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

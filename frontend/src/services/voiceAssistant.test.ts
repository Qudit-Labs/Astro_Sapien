import { describe, it, expect } from 'vitest';
import {
  cleanTextForSpeech,
  VoiceAssistantManager,
} from './voiceAssistant';

describe('Voice AI Assistant Service', () => {
  describe('cleanTextForSpeech', () => {
    it('normalizes chemical symbols and LaTeX for audio speech synthesis', () => {
      const input =
        'In microgravity, $\\text{CO}_2$ and $\\text{SF}_6$ suppress flames differently than in 1g.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toContain('carbon dioxide');
      expect(cleaned).toContain('sulfur hexafluoride');
      expect(cleaned).not.toContain('\\text{CO}');
    });

    it('strips bracketed evidence labels and source references', () => {
      const input =
        '[NASA observation] Flame length decreased under low flow [SRC-01]. [Calculated result] LOC was 15.2%.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).not.toContain('[NASA observation]');
      expect(cleaned).not.toContain('[SRC-01]');
      expect(cleaned).toContain('Flame length decreased under low flow');
      expect(cleaned).toContain('LOC was 15.2%');
    });

    it('cleans markdown formatting like bold, italics, backticks, and bullet points', () => {
      const input =
        '- **BASS-II** investigated `PMMA` slabs with *forced airflow* at 21% O₂.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).not.toContain('**');
      expect(cleaned).not.toContain('`');
      expect(cleaned).not.toContain('*');
      expect(cleaned).toContain('BASS-II investigated PMMA slabs with forced airflow at 21% oxygen');
    });

    it('handles empty or null input gracefully', () => {
      expect(cleanTextForSpeech('')).toBe('');
    });
  });

  describe('VoiceAssistantManager', () => {
    it('initializes in idle state and reports supported speech features', () => {
      const manager = new VoiceAssistantManager();
      expect(manager.getState()).toBe('idle');
      expect(typeof manager.isSpeechRecognitionSupported()).toBe('boolean');
      expect(typeof manager.isSpeechSynthesisSupported()).toBe('boolean');
      expect(typeof manager.isMediaRecorderSupported()).toBe('boolean');
      expect(typeof manager.isVoiceInputSupported()).toBe('boolean');
      expect(['web-speech', 'media-recorder', 'none']).toContain(manager.getInputMode());
    });

    it('updates options cleanly and handles toggle listening safely in node env', () => {
      const manager = new VoiceAssistantManager();
      manager.updateOptions({ rate: 1.2, autoSpeakResponse: false, silenceTimeoutMs: 1500 });
      expect(manager.getState()).toBe('idle');
      expect(manager.isListeningNow()).toBe(false);
      expect(manager.isSpeakingNow()).toBe(false);
    });
  });
});

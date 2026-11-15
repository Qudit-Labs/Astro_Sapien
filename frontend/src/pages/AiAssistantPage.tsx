import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  AlertCircle,
} from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import {
  aiAssistantService,
  AssistantMessage,
  SUGGESTED_QUESTIONS,
} from '@/services/aiAssistantService';
import {
  VoiceAssistantManager,
  VoiceState,
} from '@/services/voiceAssistant';
import { VoiceWaveformVisualizer } from '@/components/common/VoiceWaveformVisualizer';
import { PageHeader } from '@/components/common/PageHeader';
import { EvidenceBadge } from '@/components/common/EvidenceBadge';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

export const AiAssistantPage: React.FC = () => {
  const {
    investigations,
    testRuns,
    measurements,
    findings,
    sources,
    evidenceChunks,
  } = useResearchData();

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'MSG-INIT',
      role: 'assistant',
      content:
        'Welcome to the **FIRELINE Spacecraft Fire-Safety AI Assistant**.\n\nYou can interact via text or **hands-free Voice AI CapCom mode**.\n\nAsk any question regarding microgravity flame spread, suppression limits (LOC), test comparisons between BASS-II and SAFFIRE, or smoke aerosol particle sizing in SAME-R. Answers are grounded with traceable evidence citations.',
      timestamp: new Date().toISOString(),
      isMockGenerated: false,
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize Voice Manager
  const voiceManager = useMemo(() => {
    return new VoiceAssistantManager({
      onTranscript: (transcript: string, isFinal: boolean) => {
        setVoiceTranscript(transcript);
        setInput(transcript);
        if (isFinal && transcript.trim().length > 3) {
          // Final speech recognized: dispatch automatically
          setTimeout(() => {
            handleSend(transcript.trim());
            setVoiceTranscript('');
          }, 300);
        }
      },
      onStateChange: (state: VoiceState) => {
        setVoiceState(state);
        if (state !== 'speaking') {
          setActiveSpeakingMsgId(null);
        }
      },
      onError: (err: string) => {
        setVoiceError(err);
        setTimeout(() => setVoiceError(null), 6000);
      },
    });
  }, []);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      voiceManager.stopSpeaking();
      voiceManager.stopListening();
    };
  }, [voiceManager]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (questionText?: string) => {
    const query = (questionText ?? input).trim();
    if (!query || isThinking) return;

    voiceManager.stopListening();
    voiceManager.stopSpeaking();
    setVoiceTranscript('');

    const userMsg: AssistantMessage = {
      id: `MSG-USR-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsThinking(true);
    setVoiceState('processing');

    try {
      const reply = await aiAssistantService.askQuestion(query, {
        investigations,
        testRuns,
        measurements,
        findings,
        sources,
        evidenceChunks,
      });

      setMessages((prev) => [...prev, reply]);

      // If auto-speak is enabled, voice readout the assistant's answer
      if (autoSpeak && reply.content) {
        setActiveSpeakingMsgId(reply.id);
        voiceManager.speak(reply.content, () => {
          setActiveSpeakingMsgId(null);
        });
      } else {
        setVoiceState('idle');
      }
    } catch (err: any) {
      setVoiceState('error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSpeakMessage = (msgId: string, content: string) => {
    if (activeSpeakingMsgId === msgId) {
      voiceManager.stopSpeaking();
      setActiveSpeakingMsgId(null);
    } else {
      setActiveSpeakingMsgId(msgId);
      voiceManager.speak(content, () => {
        setActiveSpeakingMsgId(null);
      });
    }
  };

  const isRecognitionSupported = voiceManager.isSpeechRecognitionSupported();

  return (
    <div className="space-y-5">
      <PageHeader
        badge="Voice AI CapCom & RAG"
        title="AI Fire-Safety Research Assistant"
        subtitle="Ask scientific questions in microgravity combustion, material flammability, and smoke aerosols. Interrogate NASA PSI evidence with hands-free Voice AI transmission."
      />

      {/* Voice Warning Banner if unsupported or error */}
      {voiceError && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* A. Top Aerospace Voice AI Command Deck */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0B1D36] to-slate-900/90 border border-slate-700/60 p-4 sm:p-5 shadow-xl hud-panel relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Push-to-Talk and Status */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              type="button"
              disabled={!isRecognitionSupported || isThinking}
              onClick={() => voiceManager.toggleListening()}
              aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice transmission'}
              className={`relative p-3.5 rounded-2xl flex items-center justify-center font-semibold text-sm transition-all duration-300 shadow-lg ${
                voiceState === 'listening'
                  ? 'bg-gradient-to-r from-[#FC3D21] to-[#F5B942] text-white ring-4 ring-[#FC3D21]/40 scale-105'
                  : 'bg-gradient-to-r from-[#0B3D91] to-[#38BDF8] text-white hover:scale-105 hover:ring-2 hover:ring-[#38BDF8]/50'
              } disabled:opacity-50`}
            >
              {voiceState === 'listening' ? (
                <>
                  <MicOff className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FC3D21] hud-beacon" />
                </>
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                  VOICE AI CAPCOM:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    voiceState === 'listening'
                      ? 'bg-red-500/15 text-[#FC3D21] border-red-500/30 animate-pulse'
                      : voiceState === 'speaking'
                      ? 'bg-sky-500/15 text-[#38BDF8] border-sky-500/30'
                      : voiceState === 'processing'
                      ? 'bg-amber-500/15 text-[#F5B942] border-amber-500/30'
                      : 'bg-teal-500/15 text-[#24B8A0] border-teal-500/30'
                  }`}
                >
                  {voiceState === 'listening'
                    ? '● TRANSMITTING / LISTENING'
                    : voiceState === 'speaking'
                    ? 'AUDIO OUT / SPEAKING'
                    : voiceState === 'processing'
                    ? 'PROCESSING RAG...'
                    : 'READY (CLICK TO SPEAK)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {voiceTranscript ? (
                  <span className="font-mono text-[#38BDF8]">
                    &ldquo;{voiceTranscript}&rdquo;
                  </span>
                ) : voiceState === 'listening' ? (
                  'Speak your fire-safety question into your microphone...'
                ) : (
                  'Astronaut hands-free speech input with automated NASA CapCom readout.'
                )}
              </p>
            </div>
          </div>

          {/* Center: Live Waveform Visualizer */}
          <div className="w-full lg:w-48 flex justify-center">
            <VoiceWaveformVisualizer state={voiceState} barCount={20} />
          </div>

          {/* Right: Audio Control Action Toggles */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            {voiceState === 'speaking' && (
              <button
                type="button"
                onClick={() => voiceManager.stopSpeaking()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-[#FC3D21] border border-red-500/40 text-xs font-medium hover:bg-red-500/30 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setAutoSpeak((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                autoSpeak
                  ? 'bg-teal-500/15 text-[#24B8A0] border-teal-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#24B8A0]" />
                  <span>Auto-Audio: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auto-Audio: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Suggested Voice Commands */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-3 hud-panel shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9FB1C7]">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B942]" />
              <span>Astronaut Voice Commands</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Click any flight inquiry to dispatch with automated audio speech readout:
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isThinking}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-xs p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#38BDF8] text-slate-700 dark:text-[#F4F7FC] transition duration-150 disabled:opacity-50 flex items-start gap-2 group"
                >
                  <Radio className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="flex-1">{q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-sky-50 dark:bg-[#0B3D91]/20 border border-sky-200 dark:border-[#38BDF8]/30 p-4 text-xs text-sky-900 dark:text-[#38BDF8] space-y-1.5 hud-panel">
            <div className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#24B8A0] animate-pulse"></span>
              Live FastAPI RAG Connected
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              Queries are dispatched directly to the backend{' '}
              <code className="font-mono text-[11px] bg-slate-200 dark:bg-[#07172B] px-1 py-0.5 rounded">
                /api/v1/assistant/query
              </code>{' '}
              endpoint with Gemini RAG grounding against NASA microgravity evidence chunks, with seamless local fallback.
            </p>
          </div>
        </div>

        {/* Right: Chat & Audio Workspace */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 flex flex-col h-[650px] overflow-hidden shadow-lg hud-panel">
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-[#0B3D91] text-white shadow-md'
                      : 'bg-[#07172B] border border-[#38BDF8]/40 text-[#38BDF8] shadow-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2.5 relative group shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#0B3D91] to-[#0A2E6B] text-white'
                      : 'bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-[#F4F7FC]'
                  }`}
                >
                  {/* Top Bar for Assistant: Badges and Read Aloud Button */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.isMockGenerated && <DataStatusBadge status="synthetic_demo" />}
                        {msg.evidenceLabels?.map((ev) => (
                          <EvidenceBadge key={ev} type={ev} />
                        ))}
                      </div>

                      {/* Listen Aloud Button */}
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.id, msg.content)}
                        title={activeSpeakingMsgId === msg.id ? 'Stop reading' : 'Read aloud with CapCom voice'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition ${
                          activeSpeakingMsgId === msg.id
                            ? 'bg-red-500/15 text-[#FC3D21] border border-red-500/30 animate-pulse'
                            : 'bg-slate-200/70 dark:bg-[#10243D] text-[#38BDF8] hover:bg-[#38BDF8]/20'
                        }`}
                      >
                        {activeSpeakingMsgId === msg.id ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Voice</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#9FB1C7]">
                        Source References:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cit) => (
                          <a
                            key={cit.sourceId}
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-[#10243D] text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
                          >
                            {cit.sourceId}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#07172B] border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-xl p-4 bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-[#9FB1C7]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                  <span>Synthesizing evidence-backed answer with Gemini RAG...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Box with Integrated Push-to-Talk Mic */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#07172B] flex items-center gap-2"
          >
            {/* Quick Mic toggle in input bar */}
            <button
              type="button"
              disabled={!isRecognitionSupported || isThinking}
              onClick={() => voiceManager.toggleListening()}
              aria-label={voiceState === 'listening' ? 'Mute microphone' : 'Activate voice speech input'}
              className={`p-2.5 rounded-lg border transition ${
                voiceState === 'listening'
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-white dark:bg-[#10243D] text-slate-600 dark:text-[#38BDF8] border-slate-300 dark:border-slate-700 hover:border-[#38BDF8]'
              }`}
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or speak a question (e.g. 'What is the limiting oxygen concentration?')..."
              aria-label="Ask AI Research Assistant"
              className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-[#10243D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0B3D91] text-white text-sm font-medium hover:bg-[#0B3D91]/90 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Transmit</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

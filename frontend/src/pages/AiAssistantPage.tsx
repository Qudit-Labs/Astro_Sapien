import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, User, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import {
  aiAssistantService,
  AssistantMessage,
  SUGGESTED_QUESTIONS,
} from '@/services/aiAssistantService';
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
        'Welcome to the **FIRELINE AI Research Assistant** (Mock Demonstration Mode).\n\nAsk a scientific question about microgravity combustion, experiment comparisons, smoke aerosol behavior, or data gaps. I will search the shared synthetic findings, test runs, and evidence chunks to synthesize a cited demonstration answer.',
      timestamp: new Date().toISOString(),
      isMockGenerated: true,
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (questionText?: string) => {
    const query = (questionText ?? input).trim();
    if (!query || isThinking) return;

    const userMsg: AssistantMessage = {
      id: `MSG-USR-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsThinking(true);

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
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="Mock RAG Demonstration"
        badgeColor="amber"
        title="AI Research Assistant"
        subtitle="Keyword-indexed scientific evidence assistant over shared FIRELINE findings and NASA PSI metadata. Ready for future Gemini FastAPI integration."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Suggested Questions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9FB1C7]">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B942]" />
              <span>Suggested Scientific Questions</span>
            </div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isThinking}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-xs p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#38BDF8] text-slate-700 dark:text-[#F4F7FC] transition disabled:opacity-50"
                >
                  {q}
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
              Queries are dispatched directly to the backend <code className="font-mono text-[11px] bg-slate-200 dark:bg-[#07172B] px-1 py-0.5 rounded">/api/v1/assistant/query</code> endpoint with Gemini RAG grounding against NASA microgravity evidence chunks, with seamless local fallback.
            </p>
          </div>
        </div>

        {/* Right: Chat Workspace */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 flex flex-col h-[600px] overflow-hidden shadow-lg hud-panel">
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
                      ? 'bg-[#0B3D91] text-white'
                      : 'bg-[#07172B] border border-[#38BDF8]/40 text-[#38BDF8]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-xl p-4 text-xs space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#0B3D91] text-white'
                      : 'bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-[#F4F7FC]'
                  }`}
                >
                  {msg.role === 'assistant' && msg.isMockGenerated && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DataStatusBadge status="synthetic_demo" />
                      {msg.evidenceLabels?.map((ev) => (
                        <EvidenceBadge key={ev} type={ev} />
                      ))}
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
                  <span>Searching shared synthetic findings & evidence chunks...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#07172B] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about microgravity flame spread, smoke aerosols, or PSI investigations..."
              aria-label="Ask AI Research Assistant"
              className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-[#10243D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0B3D91] text-white text-sm font-medium hover:bg-[#0B3D91]/90 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

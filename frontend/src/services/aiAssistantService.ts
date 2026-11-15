/**
 * FIRELINE — AI Research Assistant Service Abstraction
 *
 * Defines the `AiAssistantService` contract so a future Gemini-powered FastAPI backend
 * can seamlessly replace `MockAiAssistantService` without modifying the chat UI.
 */

import {
  EvidenceChunk,
  EvidenceType,
  Finding,
  Investigation,
  Measurement,
  Source,
  TestRun,
} from '@shared/types/index';

export interface AssistantCitation {
  sourceId: string;
  title: string;
  url: string;
  investigationId?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  evidenceLabels?: EvidenceType[];
  citations?: AssistantCitation[];
  isMockGenerated?: boolean;
}

export interface AssistantQueryContext {
  investigations: Investigation[];
  testRuns: TestRun[];
  measurements: Measurement[];
  findings: Finding[];
  sources: Source[];
  evidenceChunks: EvidenceChunk[];
}

export interface AiAssistantService {
  readonly mode: 'mock' | 'api';
  askQuestion(
    query: string,
    context: AssistantQueryContext
  ): Promise<AssistantMessage>;
}

export const SUGGESTED_QUESTIONS: string[] = [
  'What influences flame spread in microgravity?',
  'Compare BASS-II and SAFFIRE.',
  'How does airflow affect smoke particle behaviour?',
  'What NASA research investigates flame extinction?',
  'What are the missing variables in these experiments?',
];

export class MockAiAssistantService implements AiAssistantService {
  readonly mode = 'mock' as const;

  async askQuestion(
    query: string,
    context: AssistantQueryContext
  ): Promise<AssistantMessage> {
    // Simulate realistic brief processing latency
    await new Promise((resolve) => setTimeout(resolve, 650));

    const q = query.toLowerCase();
    const tokens = q
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    // Score findings by keyword overlap
    const scoredFindings = context.findings
      .map((f) => {
        const haystack = `${f.title} ${f.summary} ${f.finding_text} ${f.research_category}`.toLowerCase();
        let score = 0;
        for (const tok of tokens) {
          if (haystack.includes(tok)) score += 2;
        }
        const inv = context.investigations.find((i) => i.id === f.investigation_id);
        if (inv && q.includes(inv.short_name.toLowerCase())) score += 5;
        return { finding: f, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Score evidence chunks
    const scoredChunks = context.evidenceChunks
      .map((c) => {
        const haystack = `${c.section_title} ${c.text}`.toLowerCase();
        let score = 0;
        for (const tok of tokens) {
          if (haystack.includes(tok)) score += 1;
        }
        return { chunk: c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const matchedInvs = context.investigations.filter((inv) => {
      const text = `${inv.short_name} ${inv.name} ${inv.description} ${inv.research_categories.join(' ')}`.toLowerCase();
      return tokens.some((t) => text.includes(t));
    });

    // Special-case helpful synthesis for missing variables question
    let answerBody = '';
    const evidenceLabels = new Set<EvidenceType>();
    const sourceIds = new Set<string>();

    if (q.includes('missing') || q.includes('unavailable') || q.includes('gap')) {
      const notReported = context.measurements.filter(
        (m) => m.normalized_value === null || m.data_status === 'not_reported'
      );
      answerBody = [
        `**Cross-Investigation Data Gaps & Missing Variables Analysis:**`,
        `Across the ${context.testRuns.length} synthetic test runs and ${context.measurements.length} measurement records:`,
        `- **Apparatus-Specific Parameters**: Droplet experiments (FLEX) do not report planar \`fuel_thickness\` or \`flame_spread_rate\`, whereas solid-fuel tests (BASS-II, Saffire) do not report \`fuel_diameter\` for droplets or \`smoke_aging_time\`.`,
        `- **Aerosol vs Combustion Split**: Smoke aerosol runs (SAME / SAME-R) measure \`particle_diameter\`, \`particle_number_concentration\`, and \`detector_response\`, but do not measure \`heat_release_rate\` or \`flame_spread_rate\`.`,
        `- **Null Handling**: ${notReported.length} measurement records currently have null normalized values. FIRELINE never replaces missing values with zero during normalization or TESTMATCH comparisons.`,
      ].join('\n\n');
      evidenceLabels.add('interpretation');
      sourceIds.add('SRC-PSI-25');
      sourceIds.add('SRC-PSI-101');
    } else if (scoredFindings.length > 0) {
      const topFindings = scoredFindings.map((sf) => sf.finding);
      topFindings.forEach((f) => {
        evidenceLabels.add(f.evidence_type);
        f.source_references.forEach((s) => sourceIds.add(s));
      });

      const invNames = Array.from(
        new Set(
          topFindings.map(
            (f) =>
              context.investigations.find((i) => i.id === f.investigation_id)?.short_name ||
              f.investigation_id
          )
        )
      );

      answerBody = [
        `Based on the shared FIRELINE synthetic knowledge base across **${invNames.join(', ')}**:`,
        ...topFindings.map(
          (f, idx) =>
            `**${idx + 1}. ${f.title}**\n${f.summary}\n*(Category: ${f.research_category} | Evidence: ${f.evidence_type})*`
        ),
        scoredChunks.length > 0
          ? `**Related Document Context:**\n> "${scoredChunks[0].chunk.text}" — *${scoredChunks[0].chunk.section_title}*`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    } else {
      const fallbackInvs = matchedInvs.length > 0 ? matchedInvs.slice(0, 3) : context.investigations.slice(0, 3);
      fallbackInvs.forEach((i) => i.source_ids.forEach((s) => sourceIds.add(s)));
      evidenceLabels.add('research_implication');

      answerBody = [
        `No exact keyword match was found in the synthetic findings index for "${query}", but these indexed NASA PSI investigations may be relevant:`,
        ...fallbackInvs.map(
          (i) => `- **${i.short_name} (${i.psi_id})**: ${i.name} — *${i.fire_safety_pillar.toUpperCase()} pillar*`
        ),
        `Try asking about flame spread, BASS-II vs SAFFIRE, smoke particle aging, FLEX extinction, or missing variables.`,
      ].join('\n\n');
    }

    const citations: AssistantCitation[] = Array.from(sourceIds)
      .map((id) => context.sources.find((s) => s.id === id))
      .filter((s): s is Source => Boolean(s))
      .map((s) => ({
        sourceId: s.id,
        title: s.title,
        url: s.url,
        investigationId: s.investigation_id ?? undefined,
      }));

    const disclaimerFooter =
      '\n\n---\n*Notice: This response was generated locally using synthetic demonstration content (`data_status: synthetic_demo`) and does not represent verified NASA operational predictions or live Gemini API output.*';

    return {
      id: `MSG-${Date.now()}`,
      role: 'assistant',
      content: `${answerBody}${disclaimerFooter}`,
      timestamp: new Date().toISOString(),
      evidenceLabels: Array.from(evidenceLabels),
      citations,
      isMockGenerated: true,
    };
  }
}

export const aiAssistantService: AiAssistantService = new MockAiAssistantService();

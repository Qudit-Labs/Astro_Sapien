import React, { useMemo, useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { PageHeader } from '@/components/common/PageHeader';
import {
  GeneratedReportData,
  ReportPreview,
} from '@/components/common/ReportPreview';

const PRESET_QUESTIONS = [
  'How do small-scale laboratory flammability tests compare against large-scale spacecraft cabin fires?',
  'What smoke aerosol particle sizing dynamics govern early spacecraft fire detection?',
  'How do inert gaseous diluents and low-velocity flows affect microgravity flame extinction?',
];

export const ResearchReportsPage: React.FC = () => {
  const {
    investigations,
    findings,
    comparisons,
    measurements,
    sources,
    researchReports,
  } = useResearchData();

  const [researchQuestion, setResearchQuestion] = useState(PRESET_QUESTIONS[0]);
  const [selectedInvIds, setSelectedInvIds] = useState<string[]>([
    'BASS-II',
    'SAFFIRE',
    'SAME-R',
  ]);
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([
    'FND-BASS-01',
    'FND-BASS-02',
    'FND-SAMER-01',
  ]);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeSmokeAnalysis, setIncludeSmokeAnalysis] = useState(true);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReportData | null>(null);

  const toggleInv = (id: string) => {
    setSelectedInvIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleFinding = (id: string) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const availableFindings = useMemo(() => {
    if (selectedInvIds.length === 0) return findings;
    return findings.filter((f) => selectedInvIds.includes(f.investigation_id));
  }, [findings, selectedInvIds]);

  const handleGenerate = () => {
    const chosenInvs = investigations.filter((i) => selectedInvIds.includes(i.id));
    const chosenFindings = findings.filter((f) => selectedFindingIds.includes(f.id));

    const combustionEvidence = chosenFindings
      .filter((f) => f.module_tags.includes('FIRELINE'))
      .map((f) => `${f.title}: ${f.summary}`);

    const smokeFindingsList = chosenFindings
      .filter((f) => f.module_tags.includes('SMOKEWISE'))
      .map((f) => `${f.title}: ${f.summary}`);

    const smokeMeas = measurements.filter(
      (m) =>
        selectedInvIds.includes(m.investigation_id) &&
        (m.parameter_code === 'particle_diameter' ||
          m.parameter_code === 'soot_volume_fraction') &&
        m.raw_value !== null
    );

    const smokeAnalysis = includeSmokeAnalysis
      ? [
          ...smokeFindingsList,
          ...smokeMeas
            .slice(0, 4)
            .map(
              (m) =>
                `[${m.test_run_id}] ${m.parameter_label}: ${m.raw_value} ${m.raw_unit} (SI: ${m.normalized_value} ${m.normalized_unit}) — synthetic_demo`
            ),
        ]
      : ['Smoke analysis was excluded from this report configuration.'];

    const relevantComparisons = comparisons.slice(0, 3);
    const comparisonSummary = includeComparison
      ? relevantComparisons.map(
          (c) =>
            `${c.id} (${c.test_run_a_id} vs ${c.test_run_b_id}): Prototype condition score ${
              c.weighted_score !== null ? Math.round(c.weighted_score * 100) + '%' : 'N/A'
            }, Data coverage ${Math.round(c.data_coverage * 100)}%. ${c.methodology}`
        )
      : ['Experiment comparison was excluded from this report configuration.'];

    const sourceIds = new Set<string>();
    chosenInvs.forEach((i) => i.source_ids.forEach((s) => sourceIds.add(s)));
    chosenFindings.forEach((f) => f.source_references.forEach((s) => sourceIds.add(s)));

    const reportSources = sources
      .filter((s) => sourceIds.has(s.id))
      .map((s) => ({ id: s.id, title: s.title, url: s.url }));

    const report: GeneratedReportData = {
      id: `RPT-DEMO-${Date.now().toString().slice(-4)}`,
      title: `Integrated FIRELINE Synthesis: ${chosenInvs.map((i) => i.short_name).join(', ') || 'Selected Missions'}`,
      researchQuestion,
      executiveSummary: `This synthetic demonstration report integrates ${chosenInvs.length} NASA PSI investigation(s) and ${chosenFindings.length} illustrative finding(s) across FIRELINE, TESTMATCH, and SMOKewise. All numerical values and interpretations are marked synthetic_demo for interface validation and must not be used for flight certification.`,
      investigations: chosenInvs.map((i) => ({
        id: i.id,
        short_name: i.short_name,
        name: i.name,
        psi_id: i.psi_id,
      })),
      combustionEvidence:
        combustionEvidence.length > 0
          ? combustionEvidence
          : ['No FIRELINE combustion findings selected.'],
      comparisonSummary,
      smokeAnalysis:
        smokeAnalysis.length > 0
          ? smokeAnalysis
          : ['No SMOKewise aerosol records matched selected investigations.'],
      researchImplications: [
        'Small-scale microgravity screening tests require careful scaling validation against large-scale cabin geometries.',
        'Early spacecraft fire detection benefits from dual-mode sensing covering both ultrafine wire pyrolysis and coagulated smoldering aerosols.',
      ],
      limitations: [
        'SYNTHETIC DEMONSTRATION REPORT: All measurements, findings, and comparison scores are synthetic placeholders (data_status: synthetic_demo).',
        'Missing parameters are excluded rather than treated as zero.',
      ],
      sources: reportSources,
      generatedAt: new Date().toISOString(),
      isMock: true,
    };

    setGeneratedReport(report);
  };

  // Initialize with a default generated report on first render if none yet
  const activeReport = useMemo<GeneratedReportData>(() => {
    if (generatedReport) return generatedReport;
    const base = researchReports[0];
    return {
      id: base?.id || 'RPT-0001',
      title: base?.title || 'Integrated FIRELINE Synthesis Report',
      researchQuestion: base?.research_question || PRESET_QUESTIONS[0],
      executiveSummary: base?.executive_summary || '',
      investigations: investigations
        .filter((i) => base?.investigation_ids.includes(i.id))
        .map((i) => ({
          id: i.id,
          short_name: i.short_name,
          name: i.name,
          psi_id: i.psi_id,
        })),
      combustionEvidence:
        base?.analytical_results
          .filter((a) => a.module === 'FIRELINE')
          .map((a) => `${a.heading}: ${a.key_metrics_summary}`) || [],
      comparisonSummary:
        base?.analytical_results
          .filter((a) => a.module === 'TESTMATCH')
          .map((a) => `${a.heading}: ${a.key_metrics_summary}`) || [],
      smokeAnalysis:
        base?.analytical_results
          .filter((a) => a.module === 'SMOKEWISE')
          .map((a) => `${a.heading}: ${a.key_metrics_summary}`) || [],
      researchImplications:
        base?.analytical_results.flatMap((a) => a.implications) || [],
      limitations: base?.limitations || ['Synthetic demonstration report.'],
      sources: sources
        .filter((s) => base?.source_ids.includes(s.id))
        .map((s) => ({ id: s.id, title: s.title, url: s.url })),
      generatedAt: base?.generated_at || new Date().toISOString(),
      isMock: true,
    };
  }, [generatedReport, researchReports, investigations, sources]);

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = [
      `# ${activeReport.title}`,
      `> **SYNTHETIC DEMONSTRATION REPORT** • Generated: ${activeReport.generatedAt}`,
      '',
      `## 1. Research Question`,
      activeReport.researchQuestion,
      '',
      `## 2. Executive Summary`,
      activeReport.executiveSummary,
      '',
      `## 3. Relevant NASA Investigations`,
      ...activeReport.investigations.map(
        (i) => `- **${i.short_name}** (${i.psi_id}): ${i.name}`
      ),
      '',
      `## 4. Combustion Evidence (FIRELINE)`,
      ...activeReport.combustionEvidence.map((x) => `- ${x}`),
      '',
      `## 5. Experiment Comparison (TESTMATCH)`,
      ...activeReport.comparisonSummary.map((x) => `- ${x}`),
      '',
      `## 6. Smoke Analysis (SMOKewise)`,
      ...activeReport.smokeAnalysis.map((x) => `- ${x}`),
      '',
      `## 7. Research Implications`,
      ...activeReport.researchImplications.map((x) => `- ${x}`),
      '',
      `## 8. Experimental Limitations`,
      ...activeReport.limitations.map((x) => `- ${x}`),
      '',
      `## 9. Source References`,
      ...activeReport.sources.map((s) => `- [${s.id}] ${s.title}: ${s.url}`),
    ].join('\n');

    downloadFile(md, `${activeReport.id}.md`, 'text/markdown;charset=utf-8');
  };

  const handleDownloadJson = () => {
    downloadFile(
      JSON.stringify(activeReport, null, 2),
      `${activeReport.id}.json`,
      'application/json;charset=utf-8'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Cross-Module Synthesis"
        badgeColor="blue"
        title="Integrated Research Reports"
        subtitle="Configure and export integrated 9-section spacecraft fire-safety synthesis reports combining FIRELINE, TESTMATCH, and SMOKewise evidence."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report Builder Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
              <FileText className="w-4 h-4 text-[#0B3D91] dark:text-[#38BDF8]" />
              <span>Report Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-[#9FB1C7] mb-1">
                Research Question
              </label>
              <select
                value={PRESET_QUESTIONS.includes(researchQuestion) ? researchQuestion : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') setResearchQuestion(e.target.value);
                }}
                className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-900 dark:text-[#F4F7FC] mb-2"
              >
                {PRESET_QUESTIONS.map((pq) => (
                  <option key={pq} value={pq}>
                    {pq}
                  </option>
                ))}
                <option value="custom">Custom Question</option>
              </select>
              <textarea
                rows={2}
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                aria-label="Custom research question"
                className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-900 dark:text-[#F4F7FC]"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-[#9FB1C7] mb-1.5">
                Include Investigations ({selectedInvIds.length})
              </span>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {investigations.map((inv) => (
                  <label
                    key={inv.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInvIds.includes(inv.id)}
                      onChange={() => toggleInv(inv.id)}
                      className="rounded border-slate-400 text-[#0B3D91]"
                    />
                    <span>
                      <strong>{inv.short_name}</strong> ({inv.psi_id})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-[#9FB1C7] mb-1.5">
                Include Findings ({selectedFindingIds.length})
              </span>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {availableFindings.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFindingIds.includes(f.id)}
                      onChange={() => toggleFinding(f.id)}
                      className="rounded border-slate-400 text-[#0B3D91] mt-0.5"
                    />
                    <span className="line-clamp-1">{f.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                />
                <span>Include TESTMATCH comparison results</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSmokeAnalysis}
                  onChange={(e) => setIncludeSmokeAnalysis(e.target.checked)}
                />
                <span>Include SMOKewise aerosol analysis</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white text-sm font-medium transition"
            >
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              Generate Demo Report
            </button>
          </div>
        </div>

        {/* Right: Report Preview */}
        <div className="lg:col-span-8">
          <ReportPreview
            report={activeReport}
            onDownloadMarkdown={handleDownloadMarkdown}
            onDownloadJson={handleDownloadJson}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { ExternalLink, BookOpen, ShieldCheck, Scale, GitCompare, Bot, Database } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';

export const SourcesMethodologyPage: React.FC = () => {
  const { sources, investigationById } = useResearchData();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources.filter((s) => {
      if (typeFilter !== 'all' && s.source_type !== typeFilter) return false;
      if (q) {
        const text = `${s.id} ${s.title} ${s.organization} ${s.investigation_id || ''} ${s.source_role}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [sources, search, typeFilter]);

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Provenance & Standards"
        badgeColor="blue"
        title="Sources & Scientific Methodology"
        subtitle="Authoritative NASA Physical Sciences Informatics (PSI) and NTRS source catalogue, unit normalization standards, and synthetic data governance."
      />

      {/* Source Catalogue */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F4F7FC] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#38BDF8]" />
            <span>Authoritative Source Catalogue ({filteredSources.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Filter sources..."
              ariaLabel="Filter sources"
              className="w-60"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by source category"
              className="text-xs rounded-lg bg-white dark:bg-[#10243D] border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Source Types</option>
              <option value="psi_investigation">PSI Investigation</option>
              <option value="ntrs_report">NTRS Report</option>
              <option value="nasa_guide">NASA Standard / Guide</option>
              <option value="historical_case">Historical Case</option>
            </select>
          </div>
        </div>

        {filteredSources.length === 0 ? (
          <EmptyState
            title="No sources matched your filter"
            actionLabel="Reset Source Filters"
            onAction={() => {
              setSearch('');
              setTypeFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-100 dark:bg-[#07172B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    Source Title & Organization
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    Investigation ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    DOI
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    Verification
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-[#9FB1C7]">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSources.map((s) => {
                  const inv = s.investigation_id ? investigationById[s.investigation_id] : null;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-[#F4F7FC]">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                          <span className="font-mono">{s.id}</span> • {s.organization}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-[#9FB1C7]">
                        {s.source_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#0B3D91] dark:text-[#38BDF8]">
                        {inv ? `${inv.short_name} (${inv.id})` : s.investigation_id || 'General'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                        {s.doi || 'Not assigned / null'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border border-teal-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          {s.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
                        >
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Methodology Section */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F4F7FC]">
          Platform Methodology & Data Governance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3D91] dark:text-[#38BDF8]">
              <Database className="w-4 h-4" />
              <span>Mock Data Representation & Future NASA Ingestion</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              During Phase 1–2, all numerical measurements, test run configurations, and findings are synthetic demonstrations tagged with <code className="font-mono">is_mock: true</code> and <code className="font-mono">data_status: synthetic_demo</code>. Official NASA PSI investigation titles and URLs are verified metadata. Switching <code className="font-mono">VITE_DATA_MODE=api</code> connects the frontend to a FastAPI ingestion pipeline using the exact same JSON Schema and TypeScript contracts.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-[#24B8A0]">
              <Scale className="w-4 h-4" />
              <span>SI Normalization & Missing Value Policy</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              FIRELINE preserves raw reported values alongside deterministic SI conversions (<code className="font-mono">mol/mol</code>, <code className="font-mono">m/s</code>, <code className="font-mono">Pa</code>, <code className="font-mono">K</code>, <code className="font-mono">m</code>, <code className="font-mono">1/m³</code>, <code className="font-mono">kg/m³</code>). Missing values are stored as <code className="font-mono">null</code> and are <strong>never</strong> replaced with zero—preventing false equivalence in charts and comparisons.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3D91] dark:text-[#38BDF8]">
              <GitCompare className="w-4 h-4" />
              <span>How TESTMATCH Evaluates Similarity</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              TESTMATCH compares two test runs across 9 condition, geometry, and diagnostic dimensions. Each variable is classified as <em>Similar</em>, <em>Different</em>, <em>Not available</em>, or <em>Not comparable</em>. The prototype comparability indicator is a structural heuristic weighted by available overlapping parameters—it is not a validated scientific equivalence score.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-[#F5B942]">
              <Bot className="w-4 h-4" />
              <span>Evidence Classifications & AI Boundaries</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              Findings distinguish <code className="font-mono">observed</code> measurements, <code className="font-mono">calculated</code> metrics, <code className="font-mono">interpretation</code>, and <code className="font-mono">research_implication</code>. AI-generated syntheses must always be distinguished from verified NASA observations and include explicit source citations and limitations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

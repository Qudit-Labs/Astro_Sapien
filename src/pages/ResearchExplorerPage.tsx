import React, { useMemo, useState } from 'react';
import { ExternalLink, Layers } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { Investigation } from '@shared/types/index';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterPanel } from '@/components/common/FilterPanel';
import { InvestigationCard } from '@/components/common/InvestigationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { DetailDrawer } from '@/components/common/DetailDrawer';
import { SourceCitation } from '@/components/common/SourceCitation';
import { EvidenceBadge } from '@/components/common/EvidenceBadge';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';
import { ExperimentCard } from '@/components/common/ExperimentCard';

export const ResearchExplorerPage: React.FC = () => {
  const {
    investigations,
    testRuns,
    measurements,
    sourceById,
    testRunsByInvestigationId,
    findingsByInvestigationId,
    measurementsByTestRunId,
    globalSearch,
    setGlobalSearch,
  } = useResearchData();

  const [invFilter, setInvFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gravityFilter, setGravityFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'records_desc'>('name');

  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);

  // Derive filter options dynamically
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(investigations.flatMap((i) => i.research_categories))
      ).sort(),
    [investigations]
  );

  const allGravities = useMemo(
    () =>
      Array.from(
        new Set(investigations.flatMap((i) => i.gravity_regimes))
      ).sort(),
    [investigations]
  );

  const allMaterials = useMemo(
    () =>
      Array.from(new Set(investigations.flatMap((i) => i.fuel_types))).sort(),
    [investigations]
  );

  // Measurement categories per investigation
  const measCategoriesByInv = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const m of measurements) {
      if (!map[m.investigation_id]) map[m.investigation_id] = [];
      if (!map[m.investigation_id].includes(m.parameter_category)) {
        map[m.investigation_id].push(m.parameter_category);
      }
    }
    return map;
  }, [measurements]);

  const hasActiveFilters =
    globalSearch.trim() !== '' ||
    invFilter !== 'all' ||
    categoryFilter !== 'all' ||
    gravityFilter !== 'all' ||
    materialFilter !== 'all' ||
    pillarFilter !== 'all';

  const resetFilters = () => {
    setGlobalSearch('');
    setInvFilter('all');
    setCategoryFilter('all');
    setGravityFilter('all');
    setMaterialFilter('all');
    setPillarFilter('all');
  };

  const filteredInvestigations = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();

    const list = investigations.filter((inv) => {
      if (invFilter !== 'all' && inv.id !== invFilter) return false;
      if (categoryFilter !== 'all' && !inv.research_categories.includes(categoryFilter))
        return false;
      if (gravityFilter !== 'all' && !inv.gravity_regimes.includes(gravityFilter as any))
        return false;
      if (materialFilter !== 'all' && !inv.fuel_types.includes(materialFilter))
        return false;
      if (pillarFilter !== 'all' && inv.fire_safety_pillar !== pillarFilter)
        return false;

      if (q) {
        const invRuns = testRunsByInvestigationId[inv.id] || [];
        const invFnds = findingsByInvestigationId[inv.id] || [];
        const searchable = [
          inv.short_name,
          inv.name,
          inv.psi_id,
          inv.description,
          ...inv.fuel_types,
          ...inv.research_categories,
          ...invRuns.map((r) => `${r.test_label} ${r.fuel_name}`),
          ...invFnds.map((f) => `${f.title} ${f.summary}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'records_desc') {
        const countA =
          (testRunsByInvestigationId[a.id]?.length || 0) +
          (findingsByInvestigationId[a.id]?.length || 0);
        const countB =
          (testRunsByInvestigationId[b.id]?.length || 0) +
          (findingsByInvestigationId[b.id]?.length || 0);
        return countB - countA;
      }
      return a.short_name.localeCompare(b.short_name);
    });
  }, [
    investigations,
    globalSearch,
    invFilter,
    categoryFilter,
    gravityFilter,
    materialFilter,
    pillarFilter,
    sortBy,
    testRunsByInvestigationId,
    findingsByInvestigationId,
  ]);

  const selectedRuns = selectedInv ? testRunsByInvestigationId[selectedInv.id] || [] : [];
  const selectedFindings = selectedInv ? findingsByInvestigationId[selectedInv.id] || [] : [];
  const selectedMeasurements = useMemo(() => {
    if (!selectedInv) return [];
    return measurements.filter((m) => m.investigation_id === selectedInv.id);
  }, [selectedInv, measurements]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="NASA PSI Catalogue"
        badgeColor="blue"
        title="Research Explorer"
        subtitle="Search and filter NASA Physical Sciences Informatics (PSI) microgravity combustion investigations, experimental conditions, and synthetic findings."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="explorer-sort" className="text-xs text-slate-500 dark:text-[#9FB1C7]">
              Sort:
            </label>
            <select
              id="explorer-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'records_desc')}
              className="text-xs rounded-lg bg-white dark:bg-[#10243D] border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="name">Investigation Name (A–Z)</option>
              <option value="records_desc">Available Records (High–Low)</option>
            </select>
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="space-y-3">
        <SearchBar
          value={globalSearch}
          onChange={setGlobalSearch}
          placeholder="Search investigations, PSI IDs, test runs, materials, or findings..."
          ariaLabel="Search Research Explorer"
        />

        <FilterPanel onReset={resetFilters} hasActiveFilters={hasActiveFilters}>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
              NASA Investigation
            </label>
            <select
              value={invFilter}
              onChange={(e) => setInvFilter(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Investigations ({investigations.length})</option>
              {investigations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.short_name} ({i.psi_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
              Fire-Safety Pillar
            </label>
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Pillars</option>
              <option value="prevention">Prevention</option>
              <option value="detection">Detection</option>
              <option value="suppression">Suppression</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
              Research Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
              Gravity Regime
            </label>
            <select
              value={gravityFilter}
              onChange={(e) => setGravityFilter(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Gravity Regimes</option>
              {allGravities.map((g) => (
                <option key={g} value={g}>
                  {g.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
              Fuel / Material
            </label>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All Materials</option>
              {allMaterials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </FilterPanel>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9FB1C7]">
        <span>
          Showing <strong>{filteredInvestigations.length}</strong> of {investigations.length} investigations
        </span>
        <span className="font-mono">
          {testRuns.length} TestRuns • {measurements.length} Measurements indexed
        </span>
      </div>

      {/* Investigation Cards Grid */}
      {filteredInvestigations.length === 0 ? (
        <EmptyState
          title="No matching NASA investigations"
          description="No investigations matched your active search or filter criteria."
          actionLabel="Reset All Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInvestigations.map((inv) => (
            <InvestigationCard
              key={inv.id}
              investigation={inv}
              testRunCount={(testRunsByInvestigationId[inv.id] || []).length}
              findingCount={(findingsByInvestigationId[inv.id] || []).length}
              measurementCategories={measCategoriesByInv[inv.id] || []}
              onSelect={setSelectedInv}
            />
          ))}
        </div>
      )}

      {/* Investigation Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedInv)}
        onClose={() => setSelectedInv(null)}
        title={selectedInv ? `${selectedInv.short_name} — ${selectedInv.name}` : ''}
        subtitle={selectedInv ? `NASA ${selectedInv.psi_id} • Pillar: ${selectedInv.fire_safety_pillar}` : ''}
      >
        {selectedInv && (
          <div className="space-y-6">
            {/* Overview */}
            <section className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                  Investigation Overview
                </span>
                <a
                  href={selectedInv.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
                >
                  Official NASA PSI Page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-700 dark:text-[#9FB1C7] leading-relaxed">
                {selectedInv.description}
              </p>
            </section>

            {/* Research Objectives */}
            <section className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                Research Objectives
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {selectedInv.research_objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </section>

            {/* Measurement Availability */}
            <section className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                Measurement Availability ({selectedMeasurements.length} synthetic records)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(selectedMeasurements.map((m) => m.parameter_label))).map(
                  (param) => (
                    <span
                      key={param}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-[#10243D] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-[#F4F7FC]"
                    >
                      <Layers className="w-3 h-3 text-[#24B8A0]" />
                      {param}
                    </span>
                  )
                )}
              </div>
            </section>

            {/* Related Test Runs & Experimental Conditions */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                Synthetic Test Runs & Experimental Conditions ({selectedRuns.length})
              </h3>
              <div className="space-y-2.5">
                {selectedRuns.map((tr) => (
                  <ExperimentCard
                    key={tr.id}
                    testRun={tr}
                    measurementCount={(measurementsByTestRunId[tr.id] || []).length}
                  />
                ))}
              </div>
            </section>

            {/* Findings */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                Illustrative Findings ({selectedFindings.length})
              </h3>
              <div className="space-y-2.5">
                {selectedFindings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <EvidenceBadge type={f.evidence_type} />
                      <DataStatusBadge status={f.data_status} />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FC]">
                      {f.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
                      {f.finding_text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* NASA Documentation */}
            <section className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold">
                NASA Documentation & Sources
              </h3>
              <div className="space-y-2">
                {selectedInv.source_ids.map((sId) => (
                  <SourceCitation key={sId} source={sourceById[sId]} sourceId={sId} />
                ))}
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

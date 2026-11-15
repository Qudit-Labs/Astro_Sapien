/**
 * FIRELINE — Centralized Data Provider Factory & Exports
 *
 * Instantiates the active `ResearchDataProvider` based on environment variable:
 * - `VITE_DATA_MODE=mock` -> MockResearchDataProvider
 * - `VITE_DATA_MODE=api`  -> ApiResearchDataProvider
 *
 * All frontend components and hooks must import data via this module.
 */

import { ResearchDataProvider } from './providers/ResearchDataProvider';
import { MockResearchDataProvider } from './providers/MockResearchDataProvider';
import { ApiResearchDataProvider } from './providers/ApiResearchDataProvider';

export * from './providers/ResearchDataProvider';
export * from './providers/MockResearchDataProvider';
export * from './providers/ApiResearchDataProvider';

let providerInstance: ResearchDataProvider | null = null;

export function getDataProvider(): ResearchDataProvider {
  if (!providerInstance) {
    const mode = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATA_MODE) ||
      process.env.VITE_DATA_MODE ||
      'mock'
    ).toLowerCase();

    if (mode === 'api') {
      const apiUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
        process.env.VITE_API_BASE_URL ||
        'http://localhost:8000/api/v1';
      providerInstance = new ApiResearchDataProvider(apiUrl);
    } else {
      providerInstance = new MockResearchDataProvider();
    }
  }

  return providerInstance;
}

export const dataProvider = getDataProvider();

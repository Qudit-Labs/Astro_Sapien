# FIRELINE Frontend Application

**Astro_Sapien • Spacecraft Fire-Safety Intelligence Dashboard**

React 18 + TypeScript + Vite single-page application for aerospace researchers, mission engineers, and flight safety teams.

---

## 1. Quickstart

### Install Dependencies
```bash
cd frontend
npm install
```

### Choose Data Mode in `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

- **Live FastAPI Backend Mode**:
  ```env
  VITE_DATA_MODE=api
  VITE_API_BASE_URL=http://localhost:8000/api/v1
  ```
- **Mock Data Mode (Offline demo)**:
  ```env
  VITE_DATA_MODE=mock
  ```

### Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Run Unit Tests & Typecheck
```bash
npm test
npm run typecheck
```

### Build for Production
```bash
npm run build
```

---

## 2. Directory Structure

```text
frontend/
├── src/
│   ├── components/               # UI component library
│   │   ├── common/               # Reusable cards, tables, badges, and drawers
│   │   └── layout/               # AppShell, Header, and Sidebar
│   ├── context/                  # ThemeContext (dark/light) & ResearchDataContext
│   ├── data/                     # Data provider factory and interfaces
│   │   ├── providers/            # ApiResearchDataProvider & MockResearchDataProvider
│   │   └── index.ts              # Auto-provider selector based on VITE_DATA_MODE
│   ├── pages/                    # 8 Core application pages
│   │   ├── OverviewPage.tsx      # High-level mission KPI dashboard
│   │   ├── FirelineModulePage.tsx# Combustion & flame spread analytics
│   │   ├── TestMatchModulePage.tsx# Pairwise experiment comparison engine
│   │   ├── SmokewiseModulePage.tsx# Smoke particle aging & detector implications
│   │   ├── AiAssistantPage.tsx   # Grounded Gemini research chat
│   │   ├── ResearchExplorerPage.tsx# Multi-filter experiment explorer
│   │   ├── ResearchReportsPage.tsx# Integrated report generator & preview
│   │   └── SourcesMethodologyPage.tsx# NASA PSI & NTRS provenance catalog
│   ├── services/                 # Engine API contracts & TESTMATCH calculation
│   ├── App.tsx                   # Main router and layout shell
│   └── main.tsx                  # React DOM root entry
├── public/                       # Static public assets
├── vite.config.ts                # Vite config with @shared and @datasets aliases
├── tailwind.config.js            # Tailwind styling rules and custom theme colors
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 3. Connecting to the FastAPI Backend

The frontend communicates with the FastAPI backend running at `http://127.0.0.1:8000`. The complete API contract is exported at [`openapi.json`](../openapi.json) and typed in `src/services/apiContracts.ts`.

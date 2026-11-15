import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ResearchDataProviderWrapper } from './context/ResearchDataContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { ResearchExplorerPage } from './pages/ResearchExplorerPage';
import { FirelineModulePage } from './pages/FirelineModulePage';
import { TestMatchModulePage } from './pages/TestMatchModulePage';
import { SmokewiseModulePage } from './pages/SmokewiseModulePage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { ResearchReportsPage } from './pages/ResearchReportsPage';
import { SourcesMethodologyPage } from './pages/SourcesMethodologyPage';
import { AuthPage } from './pages/AuthPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ResearchDataProviderWrapper>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/explorer" element={<ResearchExplorerPage />} />
                <Route path="/fireline" element={<FirelineModulePage />} />
                <Route path="/testmatch" element={<TestMatchModulePage />} />
                <Route path="/smokewise" element={<SmokewiseModulePage />} />
                <Route path="/assistant" element={<AiAssistantPage />} />
                <Route path="/reports" element={<ResearchReportsPage />} />
                <Route path="/sources" element={<SourcesMethodologyPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ResearchDataProviderWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

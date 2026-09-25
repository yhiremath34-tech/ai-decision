import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { DecisionListPage } from './pages/DecisionListPage.js';
import { DecisionNewPage } from './pages/DecisionNewPage.js';
import { DecisionOverviewPage } from './pages/DecisionOverviewPage.js';
import { DecisionContextPage } from './pages/DecisionContextPage.js';
import { DecisionAlternativesPage } from './pages/DecisionAlternativesPage.js';
import { DecisionCriteriaPage } from './pages/DecisionCriteriaPage.js';
import { DecisionEvidencePage } from './pages/DecisionEvidencePage.js';
import { DecisionRisksPage } from './pages/DecisionRisksPage.js';
import { DecisionAnalyzePage } from './pages/DecisionAnalyzePage.js';
import { DecisionResultsPage } from './pages/DecisionResultsPage.js';
import { DecisionReportPage } from './pages/DecisionReportPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Direct Redirects: No accounts or login needed */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />

            {/* Direct Open Workspace Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/decisions" element={<DecisionListPage />} />
              <Route path="/decisions/new" element={<DecisionNewPage />} />
              <Route path="/decisions/:id" element={<DecisionOverviewPage />} />
              <Route path="/decisions/:id/context" element={<DecisionContextPage />} />
              <Route path="/decisions/:id/alternatives" element={<DecisionAlternativesPage />} />
              <Route path="/decisions/:id/criteria" element={<DecisionCriteriaPage />} />
              <Route path="/decisions/:id/evidence" element={<DecisionEvidencePage />} />
              <Route path="/decisions/:id/risks" element={<DecisionRisksPage />} />
              <Route path="/decisions/:id/analyze" element={<DecisionAnalyzePage />} />
              <Route path="/decisions/:id/results" element={<DecisionResultsPage />} />
              <Route path="/decisions/:id/report" element={<DecisionReportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

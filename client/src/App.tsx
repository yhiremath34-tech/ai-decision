import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { Spinner } from './components/ui/Spinner.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <Spinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Workspace Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

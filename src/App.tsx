import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { trackPageView } from './lib/analytics';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Landing } from './pages/Landing';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { KickoffFlow } from './pages/KickoffFlow';
import { Community } from './pages/Community';
import { Settings } from './pages/Settings';
import { PRDDetailView } from './pages/modules/PRDDetailView';
import { RoadmapDetailView } from './pages/modules/RoadmapDetailView';
import { TasksDetailView } from './pages/modules/TasksDetailView';
import { ScratchpadDetailView } from './pages/modules/ScratchpadDetailView';
import { PromptsDetailView } from './pages/modules/PromptsDetailView';
import { SecretsDetailView } from './pages/modules/SecretsDetailView';
import { DesignDetailView } from './pages/modules/DesignDetailView';
import { DeploymentDetailView } from './pages/modules/DeploymentDetailView';
import { GlobalScratchpad } from './pages/GlobalScratchpad';

// Component to track page views automatically
function PageViewTracker() {
  const location = useLocation();
  
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  
  return null;
}

// Wrapper component to handle return URL logic
function LandingWrapper() {
  const location = useLocation();
  
  useEffect(() => {
    // Store the current path as return URL if it's not the root
    if (location.pathname !== '/' && location.pathname !== '/landing') {
      sessionStorage.setItem('returnUrl', location.pathname + location.search);
    }
  }, [location]);
  
  return <Landing />;
}

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-dim font-mono">Loading VLab...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary context="Application Root">
      <Router>
        <PageViewTracker />
        <Routes>
          {/* Landing page for unauthenticated users OR when explicitly accessing /landing or /#signup */}
          {!user ? (
            <Route path="*" element={<LandingWrapper />} />
          ) : (
            <>
              {/* About page - landing page without redirect for authenticated users */}
              <Route path="/about" element={<Landing showForAuthenticated={true} />} />
              
              {/* Landing page for anonymous users who want to sign up */}
              <Route path="/landing" element={<Landing />} />

              {/* Authenticated routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="community" element={<Community />} />
                <Route path="settings" element={<Settings />} />
                <Route path="scratchpad" element={<GlobalScratchpad />} />
                <Route path="kickoff/:projectId" element={<KickoffFlow />} />
                <Route path="workspace/:projectId" element={<Workspace />} />
                <Route path="workspace/:projectId/prd" element={<PRDDetailView />} />
                <Route path="workspace/:projectId/roadmap" element={<RoadmapDetailView />} />
                <Route path="workspace/:projectId/tasks" element={<TasksDetailView />} />
                <Route path="workspace/:projectId/scratchpad" element={<ScratchpadDetailView />} />
                <Route path="workspace/:projectId/prompts" element={<PromptsDetailView />} />
                <Route path="workspace/:projectId/secrets" element={<SecretsDetailView />} />
                <Route path="workspace/:projectId/design" element={<DesignDetailView />} />
                <Route path="workspace/:projectId/deployment" element={<DeploymentDetailView />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
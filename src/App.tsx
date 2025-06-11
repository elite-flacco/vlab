import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthForm } from './components/Auth/AuthForm';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { KickoffFlow } from './pages/KickoffFlow';
import { Community } from './pages/Community';
import { PRDDetailView } from './pages/modules/PRDDetailView';
import { RoadmapDetailView } from './pages/modules/RoadmapDetailView';
import { TasksDetailView } from './pages/modules/TasksDetailView';
import { ScratchpadDetailView } from './pages/modules/ScratchpadDetailView';
import { PromptsDetailView } from './pages/modules/PromptsDetailView';
import { SecretsDetailView } from './pages/modules/SecretsDetailView';

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading VibeLab...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="kickoff/:projectId" element={<KickoffFlow />} />
          <Route path="workspace/:projectId" element={<Workspace />} />
          <Route path="workspace/:projectId/prd" element={<PRDDetailView />} />
          <Route path="workspace/:projectId/roadmap" element={<RoadmapDetailView />} />
          <Route path="workspace/:projectId/tasks" element={<TasksDetailView />} />
          <Route path="workspace/:projectId/scratchpad" element={<ScratchpadDetailView />} />
          <Route path="workspace/:projectId/prompts" element={<PromptsDetailView />} />
          <Route path="workspace/:projectId/secrets" element={<SecretsDetailView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
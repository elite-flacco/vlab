import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NewProjectModal } from '../Projects/NewProjectModal';
import { AnonymousBanner } from '../Auth/AnonymousBanner';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { MessageCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { createProject, loading } = useProjectStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateProject = async (name: string, description?: string) => {
    if (!user) return;
    
    try {
      const project = await createProject(name, user.id, description);
      setIsNewProjectModalOpen(false);
      
      // Navigate to kick-off flow for the new project
      navigate(`/kickoff/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const openNewProjectModal = () => {
    setIsNewProjectModalOpen(true);
  };

  return (
    <div className="h-screen bg-background grid-bg flex flex-col">
      <AnonymousBanner />
      <Header onNewProjectClick={openNewProjectModal} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNewProjectClick={openNewProjectModal} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="fade-in">
            <ErrorBoundary context="Main Content Area">
              <Outlet context={{ onNewProjectClick: openNewProjectModal }} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        loading={loading}
      />
      
      {/* Floating Feedback Button */}
      {user && (
        <button
          onClick={() => window.open('https://forms.gle/xQNNk8C6t7A8a2EC6', '_blank', 'noopener,noreferrer')}
          className="fixed bottom-6 right-6 text-xs font-semibold bg-primary-dark/90 hover:bg-primary/80 text-background rounded-md px-4 py-2 flex items-center space-x-2 z-50 shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none transition-colors duration-200"
          aria-label="Provide feedback"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Feedback</span>
        </button>
      )}
    </div>
  );
};
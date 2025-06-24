import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NewProjectModal } from '../Projects/NewProjectModal';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';

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
      <Header onNewProjectClick={openNewProjectModal} />
      <div className="flex-1 flex overflow-hidden">
        <div className="h-full">
          <Sidebar onNewProjectClick={openNewProjectModal} />
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="fade-in">
            <Outlet context={{ onNewProjectClick: openNewProjectModal }} />
          </div>
        </main>
      </div>
      
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        loading={loading}
      />
    </div>
  );
};
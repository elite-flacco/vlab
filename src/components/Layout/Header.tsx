import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { LogOut, Plus, User, Terminal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onNewProjectClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProjectClick }) => {
  const { user, signOut } = useAuthStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnCommunity = location.pathname === '/community';

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 hover:text-primary transition-colors"
          >
            <Terminal className="w-6 h-6 text-primary" />
            <span className="header-title">VibeLab</span>
          </button>
          {currentProject && !isOnCommunity && (
            <div className="text-sm text-foreground-dim font-mono">
              / {currentProject.name}
            </div>
          )}
        </div>
        
        <div className="header-nav">
          <button
            onClick={onNewProjectClick}
            className="btn-primary py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-foreground-dim font-mono">
            <User className="w-4 h-4" />
            <span>{user?.name || user?.email}</span>
          </div>
          
          <button
            onClick={signOut}
            className="p-2 text-foreground-dim hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { LogOut, Plus, Terminal, UserCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  onNewProjectClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProjectClick }) => {
  const { user, signOut } = useAuthStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnCommunity = location.pathname === '/community';
  const isOnSettings = location.pathname === '/settings';

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 hover:text-primary transition-colors"
          >
            <Terminal className="w-6 h-6 text-primary" />
            <span className="header-title">VLab</span>
          </button>
          {currentProject && !isOnCommunity && !isOnSettings && (
            <div className="text-sm text-foreground-dim font-mono">
              / {currentProject.name}
            </div>
          )}
        </div>
        
        <div className="header-nav">
          <button
            onClick={() => navigate('/community')}
            className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 font-mono border ${isOnCommunity ? 'bg-primary/10 text-primary border-primary/50' : 'bg-transparent text-foreground border-foreground-dim/30 hover:bg-secondary/50 hover:text-foreground hover:border-foreground-dim/50'}`}
            style={{ height: '36px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Community
          </button>
          
          <button
            onClick={onNewProjectClick}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
          
          <ThemeToggle />
          
          {user?.is_anonymous ? (
            <button
              onClick={() => window.open('/landing?signup=true', '_blank')}
              className="btn-secondary"
              title="Create an account to keep your data safe"
            >
              <UserCheck className="w-5 h-5" />
              {/* Create Account */}
            </button>
          ) : (
            <button
              onClick={signOut}
              className="p-2 text-foreground-dim hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
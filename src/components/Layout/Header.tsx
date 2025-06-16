import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { LogOut, Settings, User, Plus, Users } from 'lucide-react';
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
        <div className="header-left">
          <button
            onClick={() => navigate('/')}
            className="header-logo"
          >
            VibeLab
          </button>
          {currentProject && !isOnCommunity && (
            <div className="header-breadcrumb">
              / {currentProject.name}
            </div>
          )}
        </div>
        
        <div className="header-right">
          <button
            onClick={() => navigate('/community')}
            className={`btn btn-outline header-nav-btn ${
              isOnCommunity ? 'header-nav-btn--active' : ''
            }`}
          >
            <Users className="btn-icon" />
            Community
          </button>
          
          <button
            onClick={onNewProjectClick}
            className="btn btn-primary header-nav-btn"
          >
            <Plus className="btn-icon" />
            New Project
          </button>
          
          <div className="header-user-info">
            <User className="header-user-icon" />
            <span className="header-user-name">{user?.name || user?.email}</span>
          </div>
          
          <button className="header-action-btn">
            <Settings className="header-action-icon" />
          </button>
          
          <button
            onClick={signOut}
            className="header-action-btn"
          >
            <LogOut className="header-action-icon" />
          </button>
        </div>
      </div>
    </header>
  );
};
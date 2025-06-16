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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            VibeLab
          </button>
          {currentProject && !isOnCommunity && (
            <div className="text-sm text-gray-500">
              / {currentProject.name}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/community')}
            className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
              isOnCommunity
                ? 'border-blue-300 text-blue-700 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Community
          </button>
          
          <button
            onClick={onNewProjectClick}
            className="btn btn-primary"
          >
            <Plus className="btn-icon" />
            New Project
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.name || user?.email}</span>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
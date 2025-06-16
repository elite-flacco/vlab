import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Plus, Folder, Settings, Archive, ChevronDown, ChevronRight, RotateCcw, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onNewProjectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewProjectClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProjects, archivedProjects, currentProject, setCurrentProject, restoreProject } = useProjectStore();
  const [showArchived, setShowArchived] = useState(false);

  const isOnCommunity = location.pathname === '/community';

  const handleProjectClick = (project: any) => {
    navigate(`/workspace/${project.id}`);
  };

  const handleRestoreProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreProject(projectId);
    } catch (error) {
      console.error('Failed to restore project:', error);
    }
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-content">
        {/* Navigation */}
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Navigation</h2>
          <div className="sidebar-nav-list">
            <button
              onClick={() => navigate('/community')}
              className={`sidebar-nav-item ${
                isOnCommunity ? 'sidebar-nav-item--active' : ''
              }`}
            >
              <Users className="sidebar-nav-icon" />
              <span>Community Hub</span>
            </button>
          </div>
        </div>

        {/* Active Projects */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h2 className="sidebar-section-title">Projects</h2>
            <button 
              onClick={onNewProjectClick}
              className="sidebar-add-btn"
            >
              <Plus className="sidebar-add-icon" />
            </button>
          </div>
          
          <div className="sidebar-project-list">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`sidebar-project-item ${
                  currentProject?.id === project.id && !isOnCommunity
                    ? 'sidebar-project-item--active'
                    : ''
                }`}
              >
                <Folder className="sidebar-project-icon" />
                <span className="sidebar-project-name">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Archived Projects */}
        {archivedProjects.length > 0 && (
          <div className="sidebar-section">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="sidebar-archived-toggle"
            >
              {showArchived ? (
                <ChevronDown className="sidebar-chevron-icon" />
              ) : (
                <ChevronRight className="sidebar-chevron-icon" />
              )}
              <Archive className="sidebar-archived-icon" />
              <span>Archived ({archivedProjects.length})</span>
            </button>

            {showArchived && (
              <div className="sidebar-archived-list">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="sidebar-archived-item"
                  >
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="sidebar-archived-project"
                    >
                      <Folder className="sidebar-project-icon" />
                      <span className="sidebar-project-name">{project.name}</span>
                    </button>
                    <button
                      onClick={(e) => handleRestoreProject(project.id, e)}
                      className="sidebar-restore-btn"
                      title="Restore project"
                    >
                      <RotateCcw className="sidebar-restore-icon" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="sidebar-footer">
          <button className="sidebar-settings-btn">
            <Settings className="sidebar-settings-icon" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
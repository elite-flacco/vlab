import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Folder, Settings, Archive, ChevronDown, ChevronRight, RotateCcw, Users, ChevronLeft, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onNewProjectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewProjectClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProjects, archivedProjects, currentProject, setCurrentProject, restoreProject } = useProjectStore();
  const [showArchived, setShowArchived] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <aside className={`h-full flex flex-col bg-background border-r border-foreground-dim/20 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Collapse Toggle */}
      <div className="p-4 border-b border-foreground-dim/20">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-foreground-dim hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Community Hub - Direct placement at same level as Projects */}
        <button
          onClick={() => navigate('/community')}
          className={isOnCommunity ? 'sidebar-item-active' : 'sidebar-item'}
          title="Community Hub"
        >
          <Users className="w-4 h-4" />
          {!isCollapsed && <span>Community Hub</span>}
        </button>

        {/* Active Projects */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <h2 className="sidebar-title">Projects</h2>
            </div>
          )}
          
          <div className="sidebar-section">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={currentProject?.id === project.id && !isOnCommunity ? 'sidebar-item-active' : 'sidebar-item'}
                title={project.name}
              >
                <Folder className="w-4 h-4" />
                {!isCollapsed && <span className="truncate">{project.name}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Archived Projects */}
        {archivedProjects.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center space-x-2 text-sm font-semibold text-foreground-dim hover:text-foreground transition-colors mb-3"
              title={`Archived Projects (${archivedProjects.length})`}
            >
              {!isCollapsed ? (
                <>
                  {showArchived ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Archive className="w-4 h-4 text-primary/70" />
                  <span>Archived ({archivedProjects.length})</span>
                </>
              ) : (
                <Archive className="w-4 h-4 text-primary/70" />
              )}
            </button>

            {showArchived && (
              <div className="sidebar-section">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-foreground-dim/70 hover:bg-secondary/50 transition-colors"
                  >
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="flex items-center space-x-2 flex-1 text-left"
                      title={project.name}
                    >
                      <Folder className="w-4 h-4" />
                      {!isCollapsed && <span className="truncate">{project.name}</span>}
                    </button>
                    {!isCollapsed && (
                      <button
                        onClick={(e) => handleRestoreProject(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-foreground-dim hover:text-primary transition-all"
                        title="Restore project"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-foreground-dim/20">
        <button 
          className="sidebar-item"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};
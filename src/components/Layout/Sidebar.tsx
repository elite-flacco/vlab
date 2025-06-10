// Fixed Sidebar.tsx - Simplified navigation logic
import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Plus, Folder, Settings, Archive, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  onNewProjectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewProjectClick }) => {
  const navigate = useNavigate();
  const { activeProjects, archivedProjects, currentProject, setCurrentProject, restoreProject } = useProjectStore();
  const [showArchived, setShowArchived] = useState(false);

  const handleProjectClick = (project: any) => {
    // Only navigate - let the Workspace component handle setting currentProject
    navigate(`/workspace/${project.id}`);
    // // Optional: Add a small delay to ensure navigation completes
    //   setTimeout(() => {
    //     setCurrentProject(project);
    //   }, 500);
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
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="space-y-6">
        {/* Active Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
            <button 
              onClick={onNewProjectClick}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  currentProject?.id === project.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Archived Projects */}
        {archivedProjects.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center space-x-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
            >
              {showArchived ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Archive className="w-4 h-4 text-orange-600" />
              <span>Archived ({archivedProjects.length})</span>
            </button>

            {showArchived && (
              <div className="space-y-1">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="flex items-center space-x-2 flex-1 text-left"
                    >
                      <Folder className="w-4 h-4" />
                      <span className="truncate">{project.name}</span>
                    </button>
                    <button
                      onClick={(e) => handleRestoreProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-green-600 transition-all"
                      title="Restore project"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
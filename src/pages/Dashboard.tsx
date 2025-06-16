import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { Plus, Calendar, Users, Star, Archive, RotateCcw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface OutletContext {
  onNewProjectClick: () => void;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    activeProjects, 
    archivedProjects, 
    loading, 
    fetchProjects, 
    archiveProject, 
    restoreProject, 
    deleteProjectPermanently 
  } = useProjectStore();
  const { onNewProjectClick } = useOutletContext<OutletContext>();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects(user.id);
    }
  }, [user, fetchProjects]);

  const handleOpenProject = (projectId: string) => {
    navigate(`/workspace/${projectId}`);
  };

  const handleArchiveProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await archiveProject(projectId);
    } catch (error) {
      console.error('Failed to archive project:', error);
    }
  };

  const handleRestoreProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreProject(projectId);
    } catch (error) {
      console.error('Failed to restore project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProjectPermanently(projectId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const totalProjects = activeProjects.length + archivedProjects.length;
  const recentlyActive = activeProjects.filter(p => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(p.updated_at) > weekAgo;
  }).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Manage your projects and continue building amazing things.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active This Week</p>
              <p className="text-2xl font-bold text-gray-900">{recentlyActive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Archive className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900">{archivedProjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates Used</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
        <button
          onClick={onNewProjectClick}
          className="btn btn-primary"
        >
          <Plus className="btn-icon" />
          New Project
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="text-center py-12 mb-8">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <Plus className="w-full h-full" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No active projects yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by creating your first project.
          </p>
          <button
            onClick={onNewProjectClick}
            className="btn btn-primary mt-4"
          >
            <Plus className="btn-icon" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleOpenProject(project.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <button
                  onClick={(e) => handleArchiveProject(project.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-orange-600 transition-all"
                  title="Archive project"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Updated {new Date(project.updated_at).toLocaleDateString()}
                </span>
                <span>
                  {project.workspace_layout.modules.length} modules
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors mb-6"
          >
            {showArchived ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <Archive className="w-5 h-5 text-orange-600" />
            <span>Archived Projects ({archivedProjects.length})</span>
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group opacity-75"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleRestoreProject(project.id, e)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Restore project"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(project.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      Archived {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                    <span>
                      {project.workspace_layout.modules.length} modules
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Permanently Delete Project</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to permanently delete this project?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. All project data including PRDs, tasks, roadmaps, notes, prompts, and secrets will be permanently deleted from the database.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(deleteConfirm)}
                  className="btn btn-error flex-1"
                >
                  <Trash2 className="btn-icon" />
                  <span>Delete Forever</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
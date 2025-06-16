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
      <div className="dashboard-loading">
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome back, {user?.name}!
        </h1>
        <p className="dashboard-subtitle">
          Manage your projects and continue building amazing things.
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon-container stat-icon-container--blue">
              <Users className="stat-icon" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Projects</p>
              <p className="stat-value">{totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon-container stat-icon-container--green">
              <Calendar className="stat-icon" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Active This Week</p>
              <p className="stat-value">{recentlyActive}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon-container stat-icon-container--orange">
              <Archive className="stat-icon" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Archived</p>
              <p className="stat-value">{archivedProjects.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon-container stat-icon-container--purple">
              <Star className="stat-icon" />
            </div>
            <div className="stat-info">
              <p className="stat-label">Templates Used</p>
              <p className="stat-value">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Your Projects</h2>
          <button
            onClick={onNewProjectClick}
            className="btn btn-primary"
          >
            <Plus className="btn-icon" />
            New Project
          </button>
        </div>

        {activeProjects.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-state-icon">
              <Plus className="empty-state-icon-svg" />
            </div>
            <h3 className="empty-state-title">No active projects yet</h3>
            <p className="empty-state-description">
              Get started by creating your first project.
            </p>
            <button
              onClick={onNewProjectClick}
              className="btn btn-primary"
            >
              <Plus className="btn-icon" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="project-card-header">
                  <h3 className="project-card-title">
                    {project.name}
                  </h3>
                  <button
                    onClick={(e) => handleArchiveProject(project.id, e)}
                    className="project-action-btn project-action-btn--archive"
                    title="Archive project"
                  >
                    <Archive className="project-action-icon" />
                  </button>
                </div>
                
                {project.description && (
                  <p className="project-card-description">
                    {project.description}
                  </p>
                )}
                
                <div className="project-card-footer">
                  <span className="project-card-date">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                  <span className="project-card-modules">
                    {project.workspace_layout.modules.length} modules
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="dashboard-section dashboard-section--archived">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="archived-toggle-btn"
          >
            {showArchived ? (
              <ChevronDown className="archived-toggle-icon" />
            ) : (
              <ChevronRight className="archived-toggle-icon" />
            )}
            <Archive className="archived-section-icon" />
            <span>Archived Projects ({archivedProjects.length})</span>
          </button>

          {showArchived && (
            <div className="projects-grid projects-grid--archived">
              {archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="project-card project-card--archived"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="project-card-header">
                    <h3 className="project-card-title project-card-title--archived">
                      {project.name}
                    </h3>
                    <div className="project-archived-actions">
                      <button
                        onClick={(e) => handleRestoreProject(project.id, e)}
                        className="project-action-btn project-action-btn--restore"
                        title="Restore project"
                      >
                        <RotateCcw className="project-action-icon" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(project.id);
                        }}
                        className="project-action-btn project-action-btn--delete"
                        title="Delete permanently"
                      >
                        <Trash2 className="project-action-icon" />
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="project-card-description project-card-description--archived">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="project-card-footer">
                    <span className="project-card-date project-card-date--archived">
                      Archived {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                    <span className="project-card-modules project-card-modules--archived">
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
        <div className="modal-overlay">
          <div className="modal-container modal-container--danger">
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="modal-icon-container modal-icon-container--danger">
                  <Trash2 className="modal-icon" />
                </div>
                <h2 className="modal-title">Permanently Delete Project</h2>
              </div>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to permanently delete this project?
              </p>
              <div className="modal-warning">
                <p className="modal-warning-text">
                  <strong>Warning:</strong> This action cannot be undone. All project data including PRDs, tasks, roadmaps, notes, prompts, and secrets will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-outline modal-action-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirm)}
                className="btn btn-error modal-action-btn"
              >
                <Trash2 className="btn-icon" />
                <span>Delete Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
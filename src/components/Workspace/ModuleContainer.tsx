import React from 'react';
import { X, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { ModuleType } from '../../types';

interface ModuleContainerProps {
  title: string;
  type: ModuleType;
  children: React.ReactNode;
  onClose?: () => void;
  onSettings?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

const getModuleIcon = (type: ModuleType) => {
  switch (type) {
    case 'prd': return '📝';
    case 'roadmap': return '🗺️';
    case 'tasks': return '✅';
    case 'scratchpad': return '✍️';
    case 'prompts': return '💬';
    case 'secrets': return '🔐';
    default: return '📄';
  }
};

export const ModuleContainer: React.FC<ModuleContainerProps> = ({
  title,
  type,
  children,
  onClose,
  onSettings,
  onMaximize,
  isMaximized = false,
}) => {
  return (
    <div className={`module-container module-container--${type}`}>
      {/* Header */}
      <div className="module-container-header">
        <div className="module-container-title-section">
          <span className="module-container-icon">{getModuleIcon(type)}</span>
          <h3 className="module-container-title">{title}</h3>
        </div>
        
        <div className="module-container-actions">
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="module-action-btn"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="module-action-icon" />
              ) : (
                <Maximize2 className="module-action-icon" />
              )}
            </button>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className="module-action-btn"
              title="Module Settings"
            >
              <Settings className="module-action-icon" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="module-action-btn module-action-btn--close"
              title="Close Module"
            >
              <X className="module-action-icon" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="module-container-content">
        {children}
      </div>
    </div>
  );
};
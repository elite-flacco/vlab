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

const getModuleColor = (type: ModuleType) => {
  switch (type) {
    case 'prd': return 'border-blue-200 bg-white';
    case 'roadmap': return 'border-green-200 bg-white';
    case 'tasks': return 'border-orange-200 bg-white';
    case 'scratchpad': return 'border-yellow-200 bg-white';
    case 'prompts': return 'border-purple-200 bg-white';
    case 'secrets': return 'border-red-200 bg-white';
    default: return 'border-gray-200 bg-white';
  }
};

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
    <div className={`h-full border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${getModuleColor(type)}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getModuleIcon(type)}</span>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Module Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Close Module"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-full p-4 overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
        {children}
      </div>
    </div>
  );
};
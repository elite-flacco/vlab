import { FileText, ListTodo, Lock, Map, Maximize2, MessageSquare, Minimize2, Settings, StickyNote, X, Palette } from 'lucide-react';
import React from 'react';
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
    case 'prd': return FileText;
    case 'roadmap': return Map;
    case 'tasks': return ListTodo;
    case 'scratchpad': return StickyNote;
    case 'prompts': return MessageSquare;
    case 'secrets': return Lock;
    case 'design': return Palette;
    default: return FileText; // Fallback icon
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
  const IconComponent = getModuleIcon(type); // Get the icon component

  return (
    <div className="h-full terminal-window shadow-lg hover:shadow-primary/10 transition-shadow">
      {/* Header */}
      <div className="terminal-header">
      <div className="flex items-center space-x-2">
          <IconComponent className="w-5 h-5 text-primary" /> {/* Render the icon component */}
          <h3 className="font-semibold text-foreground text-sm font-mono">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1 text-foreground-dim hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
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
              className="p-1 text-foreground-dim hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
              title="Module Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-foreground-dim hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
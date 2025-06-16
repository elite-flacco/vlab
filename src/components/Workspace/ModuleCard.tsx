import React from 'react';
import { FileText, Map, ListTodo, StickyNote, MessageSquare, Lock } from 'lucide-react';
import { ModuleType } from '../../types';

interface ModuleCardProps {
  title: string;
  type: ModuleType;
  summary: string;
  onClick: () => void;
}

const getModuleIconComponent = (type: ModuleType) => {
  switch (type) {
    case 'prd': return FileText;
    case 'roadmap': return Map;
    case 'tasks': return ListTodo;
    case 'scratchpad': return StickyNote;
    case 'prompts': return MessageSquare;
    case 'secrets': return Lock;
    default: return FileText;
  }
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, type, summary, onClick }) => {
  const IconComponent = getModuleIconComponent(type);

  return (
    <button
      onClick={onClick}
      className={`module-card module-card--${type} group`}
    >
      <div className={`module-icon module-icon-${type}`}>
        <IconComponent className="module-icon-svg" />
      </div>
      <h3 className="module-card-title">
        {type === 'prd' ? title.toUpperCase() : title}
      </h3>
      <p className="module-card-summary">{summary}</p>
    </button>
  );
};
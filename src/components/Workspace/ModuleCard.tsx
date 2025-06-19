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
      className={`w-full h-full flex flex-col items-start p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-left group`}
    >
      <div className={`rounded-full mb-4 transition-colors duration-200`}>
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {type === 'prd' ? title.toUpperCase() : title}
      </h3>
      <p className="text-gray-600 text-sm flex-1">{summary}</p>
    </button>
  );
};
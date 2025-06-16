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

const getModuleColorClass = (type: ModuleType) => {
  switch (type) {
    case 'prd': return 'bg-blue-100 text-blue-600';
    case 'roadmap': return 'bg-green-100 text-green-600';
    case 'tasks': return 'bg-orange-100 text-orange-600';
    case 'scratchpad': return 'bg-yellow-100 text-yellow-600';
    case 'prompts': return 'bg-purple-100 text-purple-600';
    case 'secrets': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, type, summary, onClick }) => {
  const IconComponent = getModuleIconComponent(type);
  const colorClass = getModuleColorClass(type);

  return (
    <button
      onClick={onClick}
      className="w-full h-full flex flex-col items-start p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
    >
      <div className={`p-3 rounded-full mb-4 ${colorClass}`}>
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{type === 'prd' ? title.toUpperCase() : title}</h3>
      <p className="text-gray-600 text-sm flex-1">{summary}</p>
    </button>
  );
};
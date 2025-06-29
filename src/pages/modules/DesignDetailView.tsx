import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { Palette, Sparkles, Zap, Layers, PenTool } from 'lucide-react';

export const DesignDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Design Co-Pilot" type="design">
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Palette className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">Design Co-Pilot</h2>
            <p className="text-foreground-dim text-sm mb-8">
              Our AI-powered design assistant is coming soon! Bounce ideas with AI directly in your workspace and automatically create new tasks sync'ed to your task list.
            </p>
            
            <div className="mb-8 inline-flex items-center px-4 py-2 border border-dashed border-foreground/30 rounded-lg text-sm font-medium text-foreground bg-foreground/5">
              <PenTool className="w-4 h-4 mr-2" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};
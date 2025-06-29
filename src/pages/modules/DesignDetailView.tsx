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
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Palette className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">Design Co-Pilot</h2>
            <p className="text-foreground-dim mb-8">
              Our AI-powered design assistant is coming soon! Design Co-Pilot will help you create beautiful UI components, 
              generate color schemes, and provide design suggestions for your projects.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-foreground/5 p-4 rounded-lg border border-foreground/10">
                <Sparkles className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-sm font-semibold mb-1">UI Generation</h3>
                <p className="text-xs text-foreground-dim">Generate UI components from text descriptions</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded-lg border border-foreground/10">
                <Zap className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-sm font-semibold mb-1">Color Schemes</h3>
                <p className="text-xs text-foreground-dim">Create beautiful, accessible color palettes</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded-lg border border-foreground/10">
                <Layers className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-sm font-semibold mb-1">Design System</h3>
                <p className="text-xs text-foreground-dim">Build consistent design systems effortlessly</p>
              </div>
            </div>
            
            <div className="inline-flex items-center px-4 py-2 border border-dashed border-primary/30 rounded-lg text-sm font-medium text-primary bg-primary/5">
              <PenTool className="w-4 h-4 mr-2" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};
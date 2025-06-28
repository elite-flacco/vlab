import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Save, Edit3, Eye, Loader2, RefreshCw } from 'lucide-react';
import { generatePRD } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface PRDGeneratorProps {
  projectId: string;
  ideaSummary: string;
  onPRDCreated: (prdData: { title: string; content: string; id: string }) => void;
}

export const PRDGenerator: React.FC<PRDGeneratorProps> = ({ 
  projectId, 
  ideaSummary, 
  onPRDCreated 
}) => {
  const [prdContent, setPrdContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-generate PRD when component mounts
  useEffect(() => {
    if (ideaSummary && !hasGenerated) {
      handleGeneratePRD();
    }
  }, [ideaSummary, hasGenerated]);

  const handleGeneratePRD = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedPRD = await generatePRD(ideaSummary);
      setPrdContent(generatedPRD);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating PRD:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PRD');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePRD = async () => {
    if (!prdContent.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      // Extract title from the first heading in the PRD or use a default
      const titleMatch = prdContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Product Requirements Document';

      // Save PRD to database
      const { data: prd, error: saveError } = await db.createPRD({
        project_id: projectId,
        title,
        content: prdContent,
        status: 'draft',
        ai_generated: true,
      });

      if (saveError) throw saveError;

      // Call the callback with PRD data
      onPRDCreated({
        title,
        content: prdContent,
        id: prd.id,
      });
    } catch (error) {
      console.error('Error saving PRD:', error);
      setError(error instanceof Error ? error.message : 'Failed to save PRD');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for preview
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-gray-900 mb-3 mt-6">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium text-gray-900 mb-2 mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-gray-700 mb-1">{line.slice(2)}</li>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-semibold text-gray-900 mb-2">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-gray-700 mb-2">{line}</p>;
      });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="card-title">Product Requirements Document</h3>
            <p className="text-sm text-foreground-dim">AI-generated PRD based on your idea</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </button>
          )}
          
          {hasGenerated && (
            <button
              onClick={handleGeneratePRD}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Idea Summary Reference */}
      <div className="card p-4 bg-blue-50 border-blue-200 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Based on your idea:</h4>
        <p className="card-content text-blue-800">{ideaSummary}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card mb-4 p-3 bg-red-50 border-red-200">
          <p className="card-content text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="card flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="card-title mb-2">Generating Your PRD</h3>
            <p className="card-content">
              AI is analyzing your idea and creating a comprehensive Product Requirements Document...
            </p>
          </div>
        </div>
      )}

      {/* PRD Content */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            <div className="flex-1 flex flex-col">
              <textarea
                value={prdContent}
                onChange={(e) => setPrdContent(e.target.value)}
                className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                placeholder="Edit your PRD content here..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Use markdown formatting (# for headings, - for bullets, **bold**)
              </p>
            </div>
          ) : (
            <div className="card flex-1 p-6 overflow-y-auto">
              <div className="prose prose-sm max-w-none card-content">
                {renderMarkdown(prdContent)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {hasGenerated && !isGenerating && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div className="text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Review and edit your PRD, then save to continue</span>
            </span>
          </div>
          
          <button
            onClick={handleSavePRD}
            disabled={!prdContent.trim() || isSaving}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving PRD...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save PRD & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="card flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-foreground-dim mx-auto mb-4" />
            <h3 className="card-title mb-2">Ready to Generate Your PRD</h3>
            <p className="card-content mb-6">
              I'll create a comprehensive Product Requirements Document based on your idea summary.
            </p>
            <button
              onClick={handleGeneratePRD}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate PRD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
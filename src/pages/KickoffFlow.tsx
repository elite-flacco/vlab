import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { Sparkles, ArrowRight, CheckCircle, Circle, Brain, FileText, Map, ListTodo, ClipboardList, Check } from 'lucide-react';
import { IdeaBouncer } from '../components/Kickoff/IdeaBouncer';
import { PRDGenerator } from '../components/Kickoff/PRDGenerator';
import { RoadmapGenerator } from '../components/Kickoff/RoadmapGenerator';
import { TaskGenerator } from '../components/Kickoff/TaskGenerator';

const KICKOFF_STEPS = [
  {
    id: 'ideas',
    title: 'Bounce Ideas with AI',
    description: 'What are you building?',
    icon: Brain,
    color: 'purple',
  },
  {
    id: 'summary',
    title: 'Create Summary & PRD',
    description: 'Structure your idea',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'roadmap',
    title: 'Auto-Roadmap',
    description: 'Plan your phases',
    icon: Map,
    color: 'green',
  },
  {
    id: 'tasks',
    title: 'Task Breakdown',
    description: 'Break down the work',
    icon: ListTodo,
    color: 'orange',
  },
  {
    id: 'todos',
    title: 'Create To-Do List',
    description: 'Ready to start building',
    icon: ClipboardList,
    color: 'indigo',
  },
];

export const KickoffFlow: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProjects, archivedProjects, currentProject, setCurrentProject } = useProjectStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});

  // Combine active and archived projects
  const allProjects = [...(activeProjects || []), ...(archivedProjects || [])];

  useEffect(() => {
    if (projectId) {
      const project = allProjects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      } else {
        // Project not found, redirect to dashboard
        navigate('/');
      }
    }
  }, [projectId, allProjects, setCurrentProject, navigate]);

  // Debug logging for step data
  useEffect(() => {
    console.log('🔍 KickoffFlow Debug - Current Step:', currentStep);
    console.log('🔍 KickoffFlow Debug - Step Data:', stepData);
    console.log('🔍 KickoffFlow Debug - Completed Steps:', Array.from(completedSteps));
    
    if (currentStep === 3) {
      console.log('🔍 KickoffFlow Debug - Task Step Conditions:');
      console.log('  - projectId:', projectId);
      console.log('  - stepData.summary?.prd?.content exists:', !!stepData.summary?.prd?.content);
      console.log('  - stepData.roadmap?.items exists:', !!stepData.roadmap?.items);
      console.log('  - stepData.roadmap?.items length:', stepData.roadmap?.items?.length || 0);
      
      if (stepData.summary?.prd?.content) {
        console.log('  - PRD content preview:', stepData.summary.prd.content.substring(0, 100) + '...');
      }
      if (stepData.roadmap?.items) {
        console.log('  - Roadmap items:', stepData.roadmap.items);
      }
    }
  }, [currentStep, stepData, projectId]);

  const handleStepComplete = (data?: any) => {
    console.log('🔍 KickoffFlow Debug - Step Complete:', currentStep, data);
    
    if (data) {
      setStepData(prev => {
        const newStepData = {
          ...prev,
          [KICKOFF_STEPS[currentStep].id]: data,
        };
        console.log('🔍 KickoffFlow Debug - Updated Step Data:', newStepData);
        return newStepData;
      });
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < KICKOFF_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed, navigate to workspace
      navigate(`/workspace/${projectId}`);
    }
  };

  const handleSkipToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleIdeaSelected = (ideaSummary: string) => {
    console.log('🔍 KickoffFlow Debug - Idea Selected:', ideaSummary);
    handleStepComplete({ ideaSummary });
  };

  const handlePRDCreated = (prdData: { title: string; content: string; id: string }) => {
    console.log('🔍 KickoffFlow Debug - PRD Created:', prdData);
    handleStepComplete({ prd: prdData });
  };

  const handleRoadmapGenerated = (roadmapData: { items: any[]; count: number }) => {
    console.log('🔍 KickoffFlow Debug - Roadmap Generated:', roadmapData);
    handleStepComplete( roadmapData );
  };

  const handleTasksGenerated = (tasksData: { tasks: any[]; count: number }) => {
    console.log('🔍 KickoffFlow Debug - Tasks Generated:', tasksData);
    handleStepComplete(tasksData);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const currentStepData = KICKOFF_STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Project Kick-off
            </h1>
            <p className="text-gray-600">
              Let's transform "{currentProject.name}" from idea to structured workspace
            </p>
          </div>
          <button
            onClick={handleSkipToWorkspace}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip to workspace →
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {KICKOFF_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const StepIconComponent = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isCurrent
                        ? `bg-${step.color}-100 text-${step.color}-600`
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIconComponent className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < KICKOFF_STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-3 bg-${currentStepData.color}-100 rounded-lg`}>
              <StepIcon className={`w-8 h-8 text-${currentStepData.color}-600`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 mt-1">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[500px]">
            {currentStep === 0 && projectId && (
              <IdeaBouncer
                projectId={projectId}
                onIdeaSelected={handleIdeaSelected}
              />
            )}

            {currentStep === 1 && projectId && stepData.ideas?.ideaSummary && (
              <PRDGenerator
                projectId={projectId}
                ideaSummary={stepData.ideas.ideaSummary}
                onPRDCreated={handlePRDCreated}
              />
            )}

            {currentStep === 2 && projectId && stepData.summary?.prd?.content && (
              <RoadmapGenerator
                projectId={projectId}
                prdContent={stepData.summary.prd.content}
                onRoadmapGenerated={handleRoadmapGenerated}
              />
            )}

            {currentStep === 3 && projectId && stepData.summary?.prd?.content && stepData.roadmap?.items && (
              <TaskGenerator
                projectId={projectId}
                prdContent={stepData.summary.prd.content}
                roadmapItems={stepData.roadmap.items}
                onTasksGenerated={handleTasksGenerated}
              />
            )}

            {currentStep === 4 && stepData.tasks?.tasks && (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ClipboardList className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Development To-Do List</h3>
                    <p className="text-sm text-gray-600">Ready-to-go tasks for your project workspace</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">PRD Created</p>
                        <p className="text-sm text-blue-700">{stepData.summary?.prd?.title}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Map className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Roadmap Phases</p>
                        <p className="text-sm text-green-700">{stepData.roadmap?.count || 0} development phases</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <ListTodo className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Tasks Generated</p>
                        <p className="text-sm text-orange-700">{stepData.tasks?.count || 0} actionable tasks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks Checklist */}
                <div className="flex-1 bg-gray-50 rounded-lg p-6 overflow-y-auto">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    Your Development Checklist
                  </h4>
                  
                  <div className="space-y-3">
                    {stepData.tasks.tasks.map((task: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <Circle className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            
                            <div className="flex items-center flex-wrap gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority} priority
                              </span>
                              
                              {task.estimated_hours && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {task.estimated_hours}h estimated
                                </span>
                              )}
                              
                              {task.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {task.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                    <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completion Message */}
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-semibold text-indigo-900">🎉 Your Project is Ready!</h4>
                      <p className="text-sm text-indigo-700 mt-1">
                        You now have a complete project setup with PRD, roadmap, and actionable tasks. 
                        These will be available in your workspace for ongoing development.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Action Button */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => navigate(`/workspace/${projectId}`)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-lg shadow-lg"
                  >
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Enter Your Workspace
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {currentStep > 4 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step {currentStep + 1} Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  This step will guide you through {currentStepData.description.toLowerCase()} with AI assistance.
                </p>
                
                {/* Show data from previous steps if available */}
                <div className="space-y-4 max-w-md mx-auto">
                  {stepData.ideas && (
                    <div className="bg-white p-4 rounded-lg border text-left">
                      <h4 className="font-medium text-gray-900 mb-2">Your Idea Summary:</h4>
                      <p className="text-sm text-gray-600">{stepData.ideas.ideaSummary}</p>
                    </div>
                  )}
                  
                  {stepData.summary?.prd && (
                    <div className="bg-white p-4 rounded-lg border text-left">
                      <h4 className="font-medium text-gray-900 mb-2">PRD Created:</h4>
                      <p className="text-sm text-gray-600">{stepData.summary.prd.title}</p>
                    </div>
                  )}

                  {stepData.roadmap && (
                    <div className="bg-white p-4 rounded-lg border text-left">
                      <h4 className="font-medium text-gray-900 mb-2">Roadmap Generated:</h4>
                      <p className="text-sm text-gray-600">{stepData.roadmap.count} phases planned</p>
                    </div>
                  )}

                  {stepData.tasks && (
                    <div className="bg-white p-4 rounded-lg border text-left">
                      <h4 className="font-medium text-gray-900 mb-2">Tasks Generated:</h4>
                      <p className="text-sm text-gray-600">{stepData.tasks.count} development tasks created</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleStepComplete()}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6"
                >
                  {currentStep === KICKOFF_STEPS.length - 1 ? (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue to Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Working on: <span className="font-medium text-gray-700">{currentProject.name}</span>
        {currentProject.description && (
          <span> • {currentProject.description}</span>
        )}
      </div>
    </div>
  );
};
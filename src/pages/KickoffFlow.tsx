import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { Sparkles, ArrowRight, CheckCircle, Circle, Brain, FileText, Map, ListTodo, Rocket, Check, ClipboardList } from 'lucide-react';
import { IdeaBouncer } from '../components/Kickoff/IdeaBouncer';
import { PRDGenerator } from '../components/Kickoff/PRDGenerator';
import { RoadmapGenerator } from '../components/Kickoff/RoadmapGenerator';
import { TaskGenerator } from '../components/Kickoff/TaskGenerator';

const KICKOFF_STEPS = [
  {
    id: 'ideas',
    title: 'Bounce Ideas with AI',
    description: 'Let\'s explore and refine your project concept together',
    icon: Brain,
    color: 'text-primary',
  },
  {
    id: 'summary',
    title: 'Create PRD',
    description: 'Structure your idea into a Product Requirements Document',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'roadmap',
    title: 'Create Roadmap',
    description: 'Plan your phases - AI-generated roadmap based on your PRD',
    icon: Map,
    color: 'green',
  },
  {
    id: 'tasks',
    title: 'Task Breakdown',
    description: 'Break down the work - AI-generated tasks based on your roadmap',
    icon: ListTodo,
    color: 'orange',
  },
  {
    id: 'todos',
    title: 'Ready to Roll!',
    description: 'Ready to start building',
    icon: Rocket,
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
      // Prevent redundant calls to setCurrentProject
      if (currentProject && currentProject.id === projectId) {
        return;
      }
      
      const project = allProjects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      } else {
        // Project not found, redirect to dashboard
        navigate('/');
      }
    }
  }, [projectId, allProjects, currentProject, setCurrentProject, navigate]);

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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Project Kick-off
            </h1>
            <p className="text-foreground-dim">
              Let's get you started with "{currentProject.name}"!
            </p>
          </div>
          {/* <button
            onClick={handleSkipToWorkspace}
            className="btn-secondary"
          >
            Skip to workspace →
          </button> */}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 w-full">
        <div className="flex items-center justify-between relative">
          {KICKOFF_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const StepIconComponent = step.icon;
            const isLast = index === KICKOFF_STEPS.length - 1;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center z-10 px-4">
                  <div className={`kickoff-step ${
                    isCompleted ? 'kickoff-step-completed' : 
                    isCurrent ? 'kickoff-step-current' : 'kickoff-step-upcoming'
                  }`}>
                    <div className="kickoff-step-icon">
                      {isCompleted ? (
                        <CheckCircle />
                      ) : (
                        <StepIconComponent />
                      )}
                    </div>
                    <p className="kickoff-step-title">
                      {step.title}
                    </p>
                  </div>
                </div>
                
                {/* Connector line (except for the last step) */}
                {!isLast && (
                  <div className={`kickoff-step-connector ${
                    isCompleted ? 'kickoff-step-connector-completed' : ''
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-background rounded-xl border border-border shadow-sm">
        <div className="p-8">
          {currentStep !== 4 && (
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <StepIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {currentStepData.title}
                </h2>
                <p className="text-foreground-dim mt-1">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          )}

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
                {/* Tasks Checklist */}
                {/* <div className="flex-1 bg-muted/20 border border-border rounded-xl p-6 overflow-y-auto mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-foreground flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-600" />
                      Your Development Checklist
                    </h4>
                    <span className="badge badge-info">
                      {stepData.tasks?.count || 0} tasks
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {stepData.tasks.tasks.map((task: any, index: number) => (
                      <div key={index} className="group bg-background border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-200">{task.title}</h5>
                            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                            
                            <div className="flex items-center flex-wrap gap-2.5">
                              <span className={`badge ${
                                task.priority === 'urgent' ? 'badge-priority-urgent' :
                                task.priority === 'high' ? 'badge-priority-high' :
                                task.priority === 'medium' ? 'badge-priority-medium' :
                                'badge-priority-low'
                              }`}>
                                {task.priority} priority
                              </span>
                              
                              {task.estimated_hours && (
                                <span className="badge badge-secondary">
                                  {task.estimated_hours}h estimated
                                </span>
                              )}
                              
                              {task.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {task.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                    <span key={tagIndex} className="badge badge-tag">
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span className="badge badge-secondary">+{task.tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* Completion Message */}
                <div className="mt-2 bg-gradient-to-r from-warning/5 to-warning/10 border border-warning/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-warning/10 rounded-lg mt-0.5">
                      <Sparkles className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h4 className="mb-2">🎉 Your Project is Ready!</h4>
                      <p className="text-foreground-dim text-sm">
                        You now have a complete project setup with PRD, roadmap, and actionable tasks. 
                        These will be available in your workspace for ongoing development.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Action Button */}
                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => navigate(`/workspace/${projectId}`)}
                    className="btn-primary text-lg px-8 py-2 group mt-4"
                  >
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Enter Your Workspace
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
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
      <div className="mt-6 text-center text-sm text-foreground-dim">
        Working on: <span className="font-medium text-foreground">{currentProject.name}</span>
        {currentProject.description && (
          <span> • {currentProject.description}</span>
        )}
      </div>
    </div>
  );
};
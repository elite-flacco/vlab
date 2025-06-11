import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, MessageSquare, Users, Award, Filter, ChevronDown, Heart, Copy, Check, Star, ThumbsUp, Eye, Clock, Tag as TagIcon, User, CheckCircle, AlertCircle, Bookmark } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  useCases: string[];
  submittedBy: string;
  upvotes: number;
  comments: number;
  dateSubmitted: string;
  isBookmarked?: boolean;
  tags: string[];
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  useCase: string;
  exampleOutput: string;
  tags: string[];
  submittedBy: string;
  upvotes: number;
  copies: number;
  dateSubmitted: string;
  isBookmarked?: boolean;
}

interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  submittedBy: string;
  reputation: number;
  answers: number;
  views: number;
  upvotes: number;
  isSolved: boolean;
  dateSubmitted: string;
  lastActivity: string;
}

const TOOL_CATEGORIES = [
  'Productivity', 'Creativity', 'Analysis', 'Writing', 'Design', 'Development', 'Research', 'Marketing'
];

const PROMPT_TAGS = [
  'PRD Generation', 'Design Guidelines', 'UI Feedback', 'Code Review', 'Content Creation', 
  'Data Analysis', 'Creative Writing', 'Technical Documentation', 'Marketing Copy', 'Research'
];

const QA_CATEGORIES = [
  'Technical Issues', 'Prompt Engineering', 'Tool Recommendations', 'Best Practices', 
  'Troubleshooting', 'Feature Requests', 'General Discussion'
];

export const Community: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'tools' | 'prompts' | 'qa'>('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('trending');

  // Sample data - in real app this would come from API
  const [tools] = useState<Tool[]>([
    {
      id: '1',
      name: 'Claude Artifacts',
      description: 'Interactive code and content generation with live preview capabilities',
      category: 'Development',
      useCases: ['Rapid prototyping', 'UI component creation', 'Documentation generation'],
      submittedBy: 'alex_dev',
      upvotes: 127,
      comments: 23,
      dateSubmitted: '2024-01-15',
      tags: ['coding', 'ui', 'prototyping']
    },
    {
      id: '2',
      name: 'Midjourney',
      description: 'AI-powered image generation for creative projects and design inspiration',
      category: 'Creativity',
      useCases: ['Concept art', 'Marketing visuals', 'Design inspiration'],
      submittedBy: 'creative_sarah',
      upvotes: 89,
      comments: 15,
      dateSubmitted: '2024-01-12',
      tags: ['design', 'art', 'visual']
    }
  ]);

  const [prompts] = useState<Prompt[]>([
    {
      id: '1',
      title: 'Comprehensive PRD Generator',
      description: 'Creates detailed Product Requirements Documents with all essential sections',
      content: 'Act as a senior product manager. Create a comprehensive PRD for [product idea] including: executive summary, problem statement, target users, solution overview, core features, success metrics, technical considerations, timeline, and risks.',
      useCase: 'Product planning and documentation',
      exampleOutput: 'Generated a complete PRD for a mobile fitness app with market analysis, user personas, feature specifications, and implementation roadmap.',
      tags: ['PRD Generation', 'Product Management'],
      submittedBy: 'pm_expert',
      upvotes: 156,
      copies: 89,
      dateSubmitted: '2024-01-14',
    },
    {
      id: '2',
      title: 'UI/UX Feedback Analyzer',
      description: 'Provides detailed feedback on user interface designs and user experience flows',
      content: 'As a UX expert, analyze this [design/wireframe/prototype] and provide feedback on: usability, accessibility, visual hierarchy, user flow, and improvement suggestions. Focus on [specific aspect if provided].',
      useCase: 'Design review and improvement',
      exampleOutput: 'Analyzed a dashboard design and provided 12 specific recommendations for improving user navigation and visual clarity.',
      tags: ['UI Feedback', 'Design Guidelines', 'UX Review'],
      submittedBy: 'ux_guru',
      upvotes: 92,
      copies: 67,
      dateSubmitted: '2024-01-10',
    }
  ]);

  const [questions] = useState<Question[]>([
    {
      id: '1',
      title: 'How to improve prompt consistency across different AI models?',
      content: 'I\'m working on a project that requires using multiple AI models (GPT-4, Claude, etc.) and I\'m struggling with getting consistent outputs. What are the best practices for writing prompts that work well across different models?',
      category: 'Prompt Engineering',
      tags: ['consistency', 'multi-model', 'best-practices'],
      submittedBy: 'dev_mike',
      reputation: 245,
      answers: 8,
      views: 156,
      upvotes: 23,
      isSolved: true,
      dateSubmitted: '2024-01-13',
      lastActivity: '2024-01-15'
    },
    {
      id: '2',
      title: 'Best AI tools for automated code documentation?',
      content: 'Looking for recommendations on AI tools that can help generate comprehensive documentation for existing codebases. Particularly interested in tools that can understand context and generate meaningful comments.',
      category: 'Tool Recommendations',
      tags: ['documentation', 'code', 'automation'],
      submittedBy: 'code_ninja',
      reputation: 189,
      answers: 5,
      views: 89,
      upvotes: 15,
      isSolved: false,
      dateSubmitted: '2024-01-11',
      lastActivity: '2024-01-14'
    }
  ]);

  const renderToolsSection = () => (
    <div className="space-y-6">
      {/* Tools Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tools & Tips</h2>
          <p className="text-gray-600 mt-1">Discover and share practical AI tools and usage tips</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Tool
        </button>
      </div>

      {/* Tools Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {TOOL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="trending">Trending</option>
          <option value="popular">Most Popular</option>
          <option value="recent">Most Recent</option>
        </select>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {tool.category}
                </span>
              </div>
              <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{tool.description}</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Use Cases:</h4>
              <div className="flex flex-wrap gap-1">
                {tool.useCases.map((useCase, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{tool.upvotes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{tool.comments}</span>
                </div>
              </div>
              <span>by {tool.submittedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPromptsSection = () => (
    <div className="space-y-6">
      {/* Prompts Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prompt Hub</h2>
          <p className="text-gray-600 mt-1">Searchable database of effective prompts across different domains</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Prompt
        </button>
      </div>

      {/* Prompts Filters */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
        {PROMPT_TAGS.slice(0, 6).map(tag => (
          <button
            key={tag}
            className="px-3 py-1 bg-white border border-gray-300 text-sm rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            {tag}
          </button>
        ))}
        <button className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 transition-colors">
          +{PROMPT_TAGS.length - 6} more
        </button>
      </div>

      {/* Prompts List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{prompt.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {prompt.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Prompt:</h4>
              <p className="text-sm text-gray-700 font-mono leading-relaxed">{prompt.content}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Use Case:</h4>
                <p className="text-sm text-gray-600">{prompt.useCase}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Example Output:</h4>
                <p className="text-sm text-gray-600">{prompt.exampleOutput}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{prompt.upvotes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Copy className="w-4 h-4" />
                  <span>{prompt.copies} copies</span>
                </div>
              </div>
              <span>by {prompt.submittedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQASection = () => (
    <div className="space-y-6">
      {/* Q&A Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Q&A Forum</h2>
          <p className="text-gray-600 mt-1">Ask questions and share solutions with the community</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ask Question
        </button>
      </div>

      {/* Q&A Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">All Categories</option>
          {QA_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
            Unsolved
          </button>
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
            Recent
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
                  {question.isSolved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{question.content}</p>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    {question.category}
                  </span>
                  {question.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{question.upvotes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{question.answers} answers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{question.views} views</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{question.submittedBy}</span>
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>{question.reputation}</span>
                </div>
                <span>{question.lastActivity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Main Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Community Hub</h1>
        <p className="text-gray-600">
          Connect, share, and learn with fellow AI tool enthusiasts
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSection('tools')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            activeSection === 'tools'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Tools & Tips
        </button>
        <button
          onClick={() => setActiveSection('prompts')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            activeSection === 'prompts'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Prompt Hub
        </button>
        <button
          onClick={() => setActiveSection('qa')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            activeSection === 'qa'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Q&A Forum
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${activeSection === 'tools' ? 'tools and tips' : activeSection === 'prompts' ? 'prompts' : 'questions'}...`}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Section Content */}
      {activeSection === 'tools' && renderToolsSection()}
      {activeSection === 'prompts' && renderPromptsSection()}
      {activeSection === 'qa' && renderQASection()}

      {/* Community Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Tools</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Prompts Shared</p>
              <p className="text-2xl font-bold">3,891</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Questions Solved</p>
              <p className="text-2xl font-bold">2,156</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Active Members</p>
              <p className="text-2xl font-bold">12,543</p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
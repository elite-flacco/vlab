import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// More restrictive CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIRequest {
  action: 'chat' | 'summary' | 'prd' | 'roadmap' | 'tasks' | 'design_tasks' | 'design_tasks_image' | 'deployment_checklist';
  messages?: ChatMessage[];
  ideaSummary?: string;
  prdContent?: string;
  roadmapItems?: any[];
  feedbackText?: string;
  imageData?: string;
  mimeType?: string;
  platforms?: string[];
  projectId?: string;
}

// Simple rate limiting store (in-memory for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX = 20; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. AUTHENTICATION: Validate authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. INITIALIZE SUPABASE CLIENT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. VALIDATE JWT TOKEN
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. RATE LIMITING: Check rate limit for this user
    const userId = user.id;
    const now = Date.now();
    const userRateLimit = rateLimitStore.get(userId);
    
    if (userRateLimit && now < userRateLimit.resetTime) {
      if (userRateLimit.count >= RATE_LIMIT_MAX) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      userRateLimit.count++;
    } else {
      // Reset or initialize rate limit
      rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // 5. GET OPENAI API KEY
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 6. VALIDATE REQUEST SIZE
    const requestText = await req.text();
    if (requestText.length > 5000000) { // 5MB limit for image requests
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 7. PARSE AND VALIDATE REQUEST
    let requestData: OpenAIRequest;
    try {
      requestData = JSON.parse(requestText);
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { action } = requestData;
    
    // Validate action
    const validActions = ['chat', 'summary', 'prd', 'roadmap', 'tasks', 'design_tasks', 'design_tasks_image', 'deployment_checklist'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action specified' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let openaiResponse;

    switch (action) {
      case 'chat':
        // Handle idea bouncer chat
        if (!requestData.messages) {
          throw new Error("Chat messages are required");
        }
        openaiResponse = await generateChatResponse(apiKey, requestData.messages);
        break;

      case 'summary':
        // Handle idea summary generation
        if (!requestData.messages) {
          throw new Error("Chat messages are required for summary");
        }
        openaiResponse = await generateIdeaSummary(apiKey, requestData.messages);
        break;

      case 'prd':
        // Handle PRD generation
        if (!requestData.ideaSummary) {
          throw new Error("Idea summary is required for PRD generation");
        }
        openaiResponse = await generatePRD(apiKey, requestData.ideaSummary);
        break;

      case 'roadmap':
        // Handle roadmap generation
        if (!requestData.prdContent) {
          throw new Error("PRD content is required for roadmap generation");
        }
        openaiResponse = await generateRoadmap(apiKey, requestData.prdContent);
        break;

      case 'tasks':
        // Handle tasks generation
        if (!requestData.prdContent || !requestData.roadmapItems) {
          throw new Error("PRD content and roadmap items are required for tasks generation");
        }
        openaiResponse = await generateTasks(apiKey, requestData.prdContent, requestData.roadmapItems);
        break;

      case 'design_tasks':
        // Handle design tasks generation
        if (!requestData.feedbackText) {
          throw new Error("Feedback text is required for design tasks generation");
        }
        openaiResponse = await generateDesignTasks(apiKey, requestData.feedbackText);
        break;

      case 'design_tasks_image':
        // Handle design tasks generation from image
        if (!requestData.imageData || !requestData.mimeType) {
          throw new Error("Image data and mime type are required for image analysis");
        }
        openaiResponse = await generateDesignTasksFromImage(apiKey, requestData.imageData, requestData.mimeType);
        break;

      case 'deployment_checklist':
        // Handle deployment checklist generation
        if (!requestData.platforms || !Array.isArray(requestData.platforms) || requestData.platforms.length === 0) {
          throw new Error("Platforms array is required for deployment checklist generation");
        }
        openaiResponse = await generateDeploymentChecklist(
          apiKey, 
          requestData.platforms, 
          requestData.projectId, 
          requestData.prdContent, 
          requestData.roadmapItems
        );
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({ result: openaiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log detailed error for debugging (server-side only)
    console.error("Error processing request:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      // Don't log sensitive data like API keys or user tokens
    });
    
    // Return sanitized error to client
    const sanitizedError = error instanceof Error && error.message.includes('API') 
      ? 'External service error' 
      : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to clean JSON from markdown code blocks
const cleanJsonResponse = (content: string): string => {
  return content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
};

// Input sanitization function
function sanitizeInput(input: string): string {
  // Remove potentially harmful characters and limit length
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/script chars
    .substring(0, 10000) // Limit length
    .trim();
}

// Function to generate chat response for idea bouncer
async function generateChatResponse(apiKey: string, messages: ChatMessage[]): Promise<string> {
  // Sanitize message content
  const sanitizedMessages = messages.map(msg => ({
    ...msg,
    content: sanitizeInput(msg.content)
  }));
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are an experienced product manager and startup advisor helping someone refine their project idea. Your goal is to:

1. Ask thoughtful questions to understand their vision
2. Help them clarify the problem they're solving
3. Identify their target users
4. Understand the scope and constraints
5. Guide them toward a clear, actionable project concept

Be conversational, encouraging, and practical. Ask one focused question at a time. Help them think through the "why" behind their idea, not just the "what". Keep responses concise but insightful.

When they seem to have a clear direction, acknowledge it and suggest they're ready to move to the next step.`
        },
        ...sanitizedMessages
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Sorry, I had trouble generating a response. Please try again.";
}

// Function to generate idea summary
async function generateIdeaSummary(apiKey: string, chatHistory: ChatMessage[]): Promise<string> {
  const conversationText = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${sanitizeInput(msg.content)}`)
    .join('\n\n');

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "Based on the following conversation, create a clear, concise summary of the project idea that emerged. Focus on: the core concept, target users, main problem being solved, and key features. Keep it to 2-3 sentences."
        },
        {
          role: "user",
          content: `Please summarize this project ideation conversation:\n\n${conversationText}`
        }
      ],
      max_tokens: 150,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Unable to generate summary";
}

// Function to generate PRD
async function generatePRD(apiKey: string, ideaSummary: string): Promise<string> {
  const sanitizedSummary = sanitizeInput(ideaSummary);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior product manager creating a comprehensive Product Requirements Document (PRD). Based on the project idea provided, generate a well-structured PRD in markdown format.

The PRD should include these sections:
1. **Executive Summary** - Brief overview of the product
2. **Problem Statement** - What problem are we solving?
3. **Target Users** - Who are we building this for?
4. **Solution Overview** - High-level description of the solution
5. **Core Features** - Essential features for MVP
6. **Success Metrics** - How will we measure success?
7. **Technical Considerations** - Key technical requirements or constraints
8. **Timeline & Scope** - Rough phases and what's in/out of scope
9. **Risks & Assumptions** - Potential challenges and assumptions

Make it practical, actionable, and specific to the idea provided. Use clear headings and bullet points for readability.`
        },
        {
          role: "user",
          content: `Create a PRD for this project idea: ${sanitizedSummary}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Unable to generate PRD";
}

// Function to generate roadmap
async function generateRoadmap(apiKey: string, prdContent: string): Promise<any[]> {
  const sanitizedContent = sanitizeInput(prdContent);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior product manager creating a granular development roadmap. Based on the PRD provided, break down the project into specific, actionable deliverables rather than high-level phases.

Create 8-12 specific roadmap items that represent concrete features/deliverables. Focus on individual features, components, or capabilities that can be built and shipped independently.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "User Authentication System",
    "description": "Build user registration, login, password reset, and profile management functionality",
    "status": "planned",
    "phase": "mvp",
    "milestone": true,
    "color": "#3b82f6",
    "position": 0
  }
]

Guidelines for Creating Granular Items:
- Break down features into specific, deliverable components (e.g., "User Authentication", "Product Search", "Payment Processing")
- Each item should be scoped to 1-3 weeks of development work
- Make titles specific and actionable (avoid generic terms like "Core Features")
- Descriptions should clearly define what will be built and delivered
- MVP phase (4-6 items): Essential features needed for launch - use phase: "mvp"
- Phase 2 (2-4 items): Important enhancements and improvements - use phase: "phase_2"
- Backlog (2-3 items): Nice-to-have features for future releases - use phase: "backlog"
- Mark key foundational items as milestones (milestone: true)
- Use colors: #3b82f6 (blue), #10b981 (green), #f59e0b (amber), #ef4444 (red), #8b5cf6 (purple)
- Status should always be "planned" for new roadmaps
- Position should increment from 0
- IMPORTANT: Only use these exact phase values: "mvp", "phase_2", "backlog"

Examples of good granular items:
- "User Registration & Authentication"
- "Product Catalog with Search & Filtering"
- "Shopping Cart & Checkout Flow"
- "Admin Dashboard for Order Management"
- "Email Notification System"
- "Mobile Responsive Design"
- "Payment Gateway Integration"
- "User Profile & Settings"

Avoid vague items like:
- "MVP - Core Features"
- "Phase 2 - Enhanced Features" 
- "Implement all functionality"`
        },
        {
          role: "user",
          content: `Create a granular development roadmap based on this PRD:\n\n${sanitizedContent}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonResponse(content);
    
    // Try to parse the JSON response
    const roadmapItems = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!Array.isArray(roadmapItems)) {
      throw new Error('Response is not an array');
    }

    // Ensure each item has required fields and set defaults
    return roadmapItems.map((item: any, index: number) => {
      // Validate and normalize phase
      let phase = item.phase;
      if (!['mvp', 'phase_2', 'backlog'].includes(phase)) {
        // If invalid phase, assign based on position
        if (index < 6) {
          phase = 'mvp';
        } else if (index < 10) {
          phase = 'phase_2';
        } else {
          phase = 'backlog';
        }
      }
      
      return {
        title: item.title || `Feature ${index + 1}`,
        description: item.description || 'Description not provided',
        status: 'planned',
        phase,
        milestone: item.milestone || false,
        color: item.color || '#3b82f6',
        position: index,
      };
    });
  } catch (parseError) {
    console.error('Failed to parse roadmap JSON:', content);
    
    // Fallback: create a granular roadmap structure
    return [
      {
        title: 'User Authentication System',
        description: 'Build user registration, login, password reset, and profile management functionality',
        status: 'planned',
        phase: 'mvp',
        milestone: true,
        color: '#3b82f6',
        position: 0,
      },
      {
        title: 'Core Data Models & Database',
        description: 'Design and implement the foundational data models and database schema',
        status: 'planned',
        phase: 'mvp',
        milestone: true,
        color: '#3b82f6',
        position: 1,
      },
      {
        title: 'Main User Interface',
        description: 'Create the primary user interface and navigation structure',
        status: 'planned',
        phase: 'mvp',
        milestone: false,
        color: '#3b82f6',
        position: 2,
      },
      {
        title: 'Core Feature Implementation',
        description: 'Build the main functionality identified in the requirements',
        status: 'planned',
        phase: 'mvp',
        milestone: false,
        color: '#3b82f6',
        position: 3,
      },
      {
        title: 'API Integration & Backend',
        description: 'Develop API endpoints and backend services for core functionality',
        status: 'planned',
        phase: 'mvp',
        milestone: false,
        color: '#3b82f6',
        position: 4,
      },
      {
        title: 'Testing & Quality Assurance',
        description: 'Implement testing suite and ensure application quality and reliability',
        status: 'planned',
        phase: 'mvp',
        milestone: false,
        color: '#10b981',
        position: 5,
      },
      {
        title: 'User Experience Enhancements',
        description: 'Improve user interface design and user experience based on feedback',
        status: 'planned',
        phase: 'phase_2',
        milestone: false,
        color: '#10b981',
        position: 6,
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize application performance, loading times, and responsiveness',
        status: 'planned',
        phase: 'phase_2',
        milestone: false,
        color: '#10b981',
        position: 7,
      },
      {
        title: 'Advanced Features',
        description: 'Implement additional features and capabilities for enhanced functionality',
        status: 'planned',
        phase: 'backlog',
        milestone: false,
        color: '#f59e0b',
        position: 8,
      },
      {
        title: 'Mobile App Development',
        description: 'Create mobile application versions for iOS and Android platforms',
        status: 'planned',
        phase: 'backlog',
        milestone: false,
        color: '#8b5cf6',
        position: 9,
      },
    ];
  }
}

// Function to generate tasks
async function generateTasks(apiKey: string, prdContent: string, roadmapItems: any[]): Promise<any[]> {
  const sanitizedContent = sanitizeInput(prdContent);
  const roadmapSummary = roadmapItems.map(item => 
    `${sanitizeInput(item.title)}: ${sanitizeInput(item.description)}`
  ).join('\n');

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior project manager breaking down a project into actionable tasks. Based on the PRD and roadmap provided, generate a comprehensive list of development tasks.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Task title",
    "description": "Detailed description of what needs to be done",
    "status": "todo",
    "priority": "medium",
    "estimated_hours": 8,
    "due_date": null,
    "tags": ["frontend", "backend"],
    "dependencies": [],
    "position": 0
  }
]

Guidelines:
- Create 8-15 tasks that cover the MVP and early phases
- Include a mix of frontend, backend, design, and testing tasks
- Use realistic time estimates (1-40 hours per task)
- Set appropriate priorities: "low", "medium", "high", "highest"
- Status should always be "todo" for new tasks
- Add relevant tags like "frontend", "backend", "design", "testing", "research"
- Keep dependencies empty for now (can be added later)
- Make tasks specific and actionable
- Order tasks logically by position (0, 1, 2, etc.)`
        },
        {
          role: "user",
          content: `Generate development tasks based on this PRD and roadmap:

PRD:
${sanitizedContent}

Roadmap:
${roadmapSummary}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonResponse(content);
    
    // Try to parse the JSON response
    const tasks = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array');
    }

    // Ensure each task has required fields and set defaults
    return tasks.map((task: any, index: number) => ({
      title: task.title || `Task ${index + 1}`,
      description: task.description || 'Task description',
      status: 'todo',
      priority: ['low', 'medium', 'high', 'highest'].includes(task.priority) ? task.priority : 'medium',
      estimated_hours: typeof task.estimated_hours === 'number' ? task.estimated_hours : null,
      due_date: task.due_date || null,
      tags: Array.isArray(task.tags) ? task.tags : [],
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      position: index,
    }));
  } catch (parseError) {
    console.error('Failed to parse tasks JSON:', content);
    
    // Fallback: create basic task structure
    return [
      {
        title: 'Set up project structure',
        description: 'Initialize the project repository and basic folder structure',
        status: 'todo',
        priority: 'high',
        estimated_hours: 4,
        due_date: null,
        tags: ['setup', 'backend'],
        dependencies: [],
        position: 0,
      },
      {
        title: 'Design user interface mockups',
        description: 'Create wireframes and mockups for the main user interface',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 8,
        due_date: null,
        tags: ['design', 'frontend'],
        dependencies: [],
        position: 1,
      },
      {
        title: 'Implement core functionality',
        description: 'Build the main features identified in the PRD',
        status: 'todo',
        priority: 'high',
        estimated_hours: 20,
        due_date: null,
        tags: ['frontend', 'backend'],
        dependencies: [],
        position: 2,
      },
    ];
  }
}

// Function to generate design tasks from feedback
async function generateDesignTasks(apiKey: string, feedbackText: string): Promise<any[]> {
  const sanitizedFeedback = sanitizeInput(feedbackText);
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a UI/UX design expert who analyzes design feedback and generates actionable tasks. 
          
          For the given design feedback, generate a list of specific, actionable tasks that a development team can implement. Each task should be:
          1. Clear and specific
          2. Focused on a single improvement
          3. Implementable by developers
          4. Properly prioritized based on impact and effort
          
          Return ONLY a valid JSON array with this exact structure:
          [
            {
              "title": "Task title (max 60 characters)",
              "description": "Detailed description of what needs to be done",
              "status": "todo",
              "priority": "low" | "medium" | "high" | "highest",
              "estimated_hours": number (optional),
              "due_date": null,
              "tags": ["tag1", "tag2"],
              "dependencies": [],
              "position": number
            }
          ]
          
          Prioritize tasks as:
          - "highest": Critical UX issues, accessibility problems, broken functionality
          - "high": Important user experience improvements, major visual issues
          - "medium": Nice-to-have improvements, minor visual tweaks
          - "low": Polish items, very minor improvements
          
          Use relevant tags like: "ui", "ux", "accessibility", "performance", "mobile", "desktop", "component", "layout", "typography", "color", "animation", etc.
          
          Generate 3-8 tasks based on the feedback complexity.`
        },
        {
          role: "user",
          content: `Please analyze this design feedback and generate actionable tasks:\n\n${sanitizedFeedback}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonResponse(content);
    
    // Try to parse the JSON response
    const tasks = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array');
    }

    // Ensure each task has required fields and set defaults
    return tasks.map((task: any, index: number) => ({
      title: task.title || `Design Task ${index + 1}`,
      description: task.description || 'Design task description',
      status: 'todo',
      priority: ['low', 'medium', 'high', 'highest'].includes(task.priority) ? task.priority : 'medium',
      estimated_hours: typeof task.estimated_hours === 'number' ? task.estimated_hours : null,
      due_date: null,
      tags: Array.isArray(task.tags) ? task.tags : [],
      dependencies: [],
      position: index,
    }));
  } catch (parseError) {
    console.error('Failed to parse design tasks JSON:', content);
    
    // Fallback: create basic task structure
    return [
      {
        title: 'Implement design feedback',
        description: 'Address the design feedback provided',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 4,
        due_date: null,
        tags: ['design', 'ui'],
        dependencies: [],
        position: 0,
      },
    ];
  }
}

// Function to generate design tasks from image analysis
async function generateDesignTasksFromImage(apiKey: string, imageData: string, mimeType: string): Promise<any[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior UI/UX designer and expert who analyzes design screenshots to identify issues and improvements. 
          
          Analyze the uploaded design screenshot and identify specific, actionable design improvements. Focus on:
          
          **Visual Design Issues:**
          - Typography hierarchy and readability
          - Color contrast and accessibility
          - Visual hierarchy and layout
          - Spacing and alignment issues
          - Component consistency
          
          **User Experience Problems:**
          - Navigation clarity
          - Call-to-action effectiveness
          - Information architecture
          - Mobile responsiveness indicators
          - User flow obstacles
          
          **Accessibility Concerns:**
          - Color contrast ratios
          - Text readability
          - Touch target sizes
          - Focus indicators
          
          Return ONLY a valid JSON array with this exact structure:
          [
            {
              "title": "Fix color contrast in navigation",
              "description": "The navigation text has insufficient contrast against the background. Current contrast appears to be below WCAG AA standards. Use darker text or lighter background to improve readability.",
              "status": "todo",
              "priority": "high",
              "estimated_hours": 2,
              "due_date": null,
              "tags": ["accessibility", "navigation", "contrast"],
              "dependencies": [],
              "position": 0
            }
          ]
          
          Guidelines:
          - Be specific about what you observe in the image
          - Provide actionable solutions, not just problems
          - Include relevant tags for categorization
          - Use appropriate priority levels (low, medium, high, highest)
          - Generate 3-8 tasks based on what you see
          - Reference specific UI elements you can identify
          - Focus on implementable improvements`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this design screenshot and generate specific, actionable tasks to improve the design:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonResponse(content);
    
    // Try to parse the JSON response
    const tasks = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array');
    }

    // Ensure each task has required fields and set defaults
    return tasks.map((task: any, index: number) => ({
      title: task.title || `Design Task ${index + 1}`,
      description: task.description || 'Design task description',
      status: 'todo',
      priority: ['low', 'medium', 'high', 'highest'].includes(task.priority) ? task.priority : 'medium',
      estimated_hours: typeof task.estimated_hours === 'number' ? task.estimated_hours : null,
      due_date: null,
      tags: Array.isArray(task.tags) ? task.tags : [],
      dependencies: [],
      position: index,
    }));
  } catch (parseError) {
    console.error('Failed to parse design tasks JSON:', content);
    
    // Fallback: create basic task structure
    return [
      {
        title: 'Analyze uploaded design',
        description: 'Review the uploaded design screenshot for potential improvements',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 4,
        due_date: null,
        tags: ['design', 'analysis'],
        dependencies: [],
        position: 0,
      },
    ];
  }
}

// Function to generate deployment checklist
async function generateDeploymentChecklist(apiKey: string, platforms: string[], projectId?: string, prdContent?: string, roadmapItems?: any[]): Promise<any[]> {
  const sanitizedPlatforms = platforms.map(p => sanitizeInput(p)).join(', ');
  const sanitizedContent = prdContent ? sanitizeInput(prdContent) : '';
  const roadmapSummary = roadmapItems ? roadmapItems.map(item => 
    `${sanitizeInput(item.title)}: ${sanitizeInput(item.description)}`
  ).join('\n') : '';

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior DevOps engineer creating PROJECT-SPECIFIC deployment tasks. Platform-specific tasks (like Vercel/Netlify setup) are handled separately. Focus ONLY on tasks that are unique to this specific project based on its features, architecture, and requirements.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Configure project-specific API rate limits",
    "description": "Set up API rate limiting based on the project's expected user load and feature requirements", 
    "category": "performance",
    "environment": "production",
    "status": "todo",
    "priority": "medium",
    "is_required": true,
    "verification_notes": "Test API endpoints under load to verify rate limits work correctly",
    "helpful_links": [],
    "position": 0
  }
]

Guidelines for Project-Specific Tasks:
- Create 3-8 items that are UNIQUE to this project
- DO NOT include generic platform tasks (deployment, domain setup, SSL, etc.)
- Focus on project features, integrations, and business requirements
- Categories: "database", "auth", "security", "monitoring", "testing", "ssl", "performance"
- Platform should match one of the selected platforms: ${sanitizedPlatforms}
- Environment: "production" (unless testing/staging specific)
- Priority: "low", "medium", "high", "critical"
- Status should always be "todo"
- Include verification steps in verification_notes

Focus on PROJECT-SPECIFIC areas like:
**Data & Content:**
- Project-specific database seeding or migrations
- Content management setup
- Data import/export procedures

**Integrations & APIs:**
- Third-party service configurations specific to project features
- Payment gateway setup (if e-commerce)
- Email service configuration for project notifications
- Analytics tracking for project-specific events

**Business Logic:**
- Project-specific workflow testing
- Feature flag configurations
- Business rule validations

**Project Features:**
- Test project's unique functionality in production
- Configure project-specific user roles/permissions
- Set up project-specific monitoring alerts

Make tasks highly specific to the project's purpose and features. Order by position (0, 1, 2, etc.).`
        },
        {
          role: "user", 
          content: `Generate project-specific deployment tasks for platforms: ${sanitizedPlatforms}

${sanitizedContent ? `PRD:\n${sanitizedContent}\n` : ''}
${roadmapSummary ? `Roadmap:\n${roadmapSummary}\n` : ''}

${!sanitizedContent && !roadmapSummary ? 
  'Since no PRD or roadmap is provided, generate 3-5 common project-specific deployment tasks that apply to most web applications.' : 
  'Based on the project details above, create deployment tasks specific to this project\'s features and requirements.'
}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonResponse(content);
    
    // Try to parse the JSON response
    const deploymentItems = JSON.parse(cleanedContent);
    
    // Validate the structure
    if (!Array.isArray(deploymentItems)) {
      throw new Error('Response is not an array');
    }

    // Ensure each item has required fields and set defaults
    return deploymentItems.map((item: any, index: number) => ({
      title: item.title || `Deployment Task ${index + 1}`,
      description: item.description || 'Deployment task description',
      category: ['general', 'hosting', 'database', 'auth', 'env', 'security', 'monitoring', 'testing', 'dns', 'ssl'].includes(item.category) ? item.category : 'general',
      platform: ['universal', 'vercel', 'netlify', 'aws', 'gcp', 'azure', 'heroku', 'digitalocean', 'supabase'].includes(item.platform) ? item.platform : 'universal',
      environment: ['development', 'staging', 'production'].includes(item.environment) ? item.environment : 'production',
      status: 'todo',
      priority: ['low', 'medium', 'high', 'critical'].includes(item.priority) ? item.priority : 'medium',
      is_required: typeof item.is_required === 'boolean' ? item.is_required : true,
      verification_notes: item.verification_notes || '',
      helpful_links: Array.isArray(item.helpful_links) ? item.helpful_links : [],
      position: index,
    }));
  } catch (parseError) {
    console.error('Failed to parse deployment checklist JSON:', content);
    
    // Fallback: create basic deployment checklist
    return [
      {
        title: 'Set up production hosting',
        description: 'Deploy the application to a production hosting platform like Vercel, Netlify, or AWS',
        category: 'hosting',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'critical',
        is_required: true,
        verification_notes: 'Verify application loads correctly in production environment',
        helpful_links: [],
        position: 0,
      },
      {
        title: 'Configure environment variables',
        description: 'Set up all required environment variables in production including API keys and database URLs',
        category: 'env',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'critical',
        is_required: true,
        verification_notes: 'Test that all environment-dependent features work in production',
        helpful_links: [],
        position: 1,
      },
      {
        title: 'Set up custom domain and SSL',
        description: 'Configure custom domain name and ensure SSL certificate is properly installed',
        category: 'dns',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'high',
        is_required: true,
        verification_notes: 'Verify HTTPS redirect works and certificate is valid',
        helpful_links: [],
        position: 2,
      },
      {
        title: 'Configure authentication redirects',
        description: 'Update authentication provider settings with production URLs for OAuth callbacks',
        category: 'auth',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'critical',
        is_required: true,
        verification_notes: 'Test login flow works from production domain',
        helpful_links: [],
        position: 3,
      },
      {
        title: 'Set up error monitoring',
        description: 'Configure error tracking service like Sentry to monitor production issues',
        category: 'monitoring',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'medium',
        is_required: false,
        verification_notes: 'Verify errors are being captured and reported correctly',
        helpful_links: [],
        position: 4,
      },
      {
        title: 'Production testing checklist',
        description: 'Run comprehensive tests on production environment including all critical user flows',
        category: 'testing',
        platform: 'universal',
        environment: 'production',
        status: 'todo',
        priority: 'high',
        is_required: true,
        verification_notes: 'Document test results and any issues found',
        helpful_links: [],
        position: 5,
      },
    ];
  }
}
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
  action: 'chat' | 'summary' | 'prd' | 'roadmap' | 'tasks' | 'design_tasks';
  messages?: ChatMessage[];
  ideaSummary?: string;
  prdContent?: string;
  roadmapItems?: any[];
  feedbackText?: string;
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
    if (requestText.length > 50000) { // 50KB limit
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
    const validActions = ['chat', 'summary', 'prd', 'roadmap', 'tasks', 'design_tasks'];
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a senior product manager creating a development roadmap. Based on the PRD provided, generate a phased roadmap that breaks down the project into logical development phases.

Create 3-5 roadmap items representing different phases. Each phase should build upon the previous one.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "MVP - Core Features",
    "description": "Detailed description of what will be built in this phase",
    "status": "planned",
    "phase": "mvp",
    "milestone": true,
    "color": "#3b82f6",
    "position": 0
  }
]

Guidelines:
- First phase should ALWAYS have phase: "mvp" with core features
- Second phase should have phase: "phase_2" for enhanced features
- Additional phases should have phase: "backlog" for future items
- Mark major phases as milestones (milestone: true)
- Use colors: #3b82f6 (blue), #10b981 (green), #f59e0b (amber), #ef4444 (red), #8b5cf6 (purple)
- Keep descriptions concise but specific
- Status should always be "planned" for new roadmaps
- Position should increment from 0`
        },
        {
          role: "user",
          content: `Create a development roadmap based on this PRD:\n\n${sanitizedContent}`
        }
      ],
      max_tokens: 1000,
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
    return roadmapItems.map((item: any, index: number) => ({
      title: item.title || `Phase ${index + 1}`,
      description: item.description || 'Description not provided',
      status: 'planned',
      phase: item.phase || (index === 0 ? 'mvp' : index === 1 ? 'phase_2' : 'backlog'),
      milestone: item.milestone || false,
      color: item.color || '#3b82f6',
      position: index,
    }));
  } catch (parseError) {
    console.error('Failed to parse roadmap JSON:', content);
    
    // Fallback: create a basic roadmap structure
    return [
      {
        title: 'MVP - Core Features',
        description: 'Build the essential features needed for the minimum viable product',
        status: 'planned',
        phase: 'mvp',
        milestone: true,
        color: '#3b82f6',
        position: 0,
      },
      {
        title: 'Phase 2 - Enhanced Features',
        description: 'Add additional features and improvements based on user feedback',
        status: 'planned',
        phase: 'phase_2',
        milestone: false,
        color: '#10b981',
        position: 1,
      },
      {
        title: 'Future Enhancements',
        description: 'Advanced features and optimizations for future releases',
        status: 'planned',
        phase: 'backlog',
        milestone: false,
        color: '#f59e0b',
        position: 2,
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-4o-mini",
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
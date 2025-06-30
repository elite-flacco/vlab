import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIRequest {
  action: 'chat' | 'summary' | 'prd' | 'roadmap' | 'tasks';
  messages?: ChatMessage[];
  ideaSummary?: string;
  prdContent?: string;
  roadmapItems?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment variable
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Parse request body
    const requestData: OpenAIRequest = await req.json();
    const { action } = requestData;

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

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({ result: openaiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
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

// Function to generate chat response for idea bouncer
async function generateChatResponse(apiKey: string, messages: ChatMessage[]): Promise<string> {
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
        ...messages
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
    .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
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
          content: `Create a PRD for this project idea: ${ideaSummary}`
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
          content: `Create a development roadmap based on this PRD:\n\n${prdContent}`
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
  const roadmapSummary = roadmapItems.map(item => 
    `${item.title}: ${item.description}`
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
- Set appropriate priorities: "low", "medium", "high", "urgent"
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
${prdContent}

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
      priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium',
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
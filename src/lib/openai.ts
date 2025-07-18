interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RoadmapItem {
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  phase: 'mvp' | 'phase_2' | 'backlog';
  start_date?: string;
  end_date?: string;
  milestone: boolean;
  color: string;
  position: number;
}

interface TaskItem {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'highest';
  estimated_hours?: number;
  due_date?: string;
  tags: string[];
  dependencies: string[];
  position: number;
}

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Helper function to get auth headers
const getAuthHeaders = async () => {
  // Import the supabase client
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const generateIdeaResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'chat',
        messages
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || 'Sorry, I had trouble generating a response. Please try again.';
  } catch (error) {
    console.error('Error in generateIdeaResponse:', error);
    throw error;
  }
};

export const generateIdeaSummary = async (chatHistory: ChatMessage[]): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'summary',
        messages: chatHistory
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || 'Unable to generate summary';
  } catch (error) {
    console.error('Error in generateIdeaSummary:', error);
    throw error;
  }
};

export const generatePRD = async (ideaSummary: string): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'prd',
        ideaSummary
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || 'Unable to generate PRD';
  } catch (error) {
    console.error('Error in generatePRD:', error);
    throw error;
  }
};

export const generateRoadmap = async (prdContent: string): Promise<RoadmapItem[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'roadmap',
        prdContent
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error in generateRoadmap:', error);
    throw error;
  }
};

export const generateTasks = async (prdContent: string, roadmapItems: RoadmapItem[]): Promise<TaskItem[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'tasks',
        prdContent,
        roadmapItems
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error in generateTasks:', error);
    throw error;
  }
};

export const generateDesignTasks = async (feedbackText: string): Promise<TaskItem[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'design_tasks',
        feedbackText: feedbackText
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error in generateDesignTasks:', error);
    throw error;
  }
};

export const generateDesignTasksFromImage = async (imageFile: File): Promise<TaskItem[]> => {
  try {
    const headers = await getAuthHeaders();
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/openai-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'design_tasks_image',
        imageData: base64Image,
        mimeType: imageFile.type
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error in generateDesignTasksFromImage:', error);
    throw error;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};
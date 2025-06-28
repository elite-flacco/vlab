import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Save, MessageCircle, Loader2 } from 'lucide-react';
import { generateIdeaResponse, generateIdeaSummary } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface IdeaBouncerProps {
  projectId: string;
  onIdeaSelected: (ideaSummary: string) => void;
}

export const IdeaBouncer: React.FC<IdeaBouncerProps> = ({ projectId, onIdeaSelected }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you refine your project idea. What are you thinking of building? Don't worry about having all the details figured out - let's explore it together! 🚀",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const chatHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await generateIdeaResponse(chatHistory);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you try rephrasing your message? In the meantime, feel free to continue describing your idea!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveIdea = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Generate a summary of the conversation
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const ideaSummary = await generateIdeaSummary(chatHistory);

      // Save the full conversation to scratchpad
      const conversationText = messages
        .map(msg => `**${msg.role === 'user' ? 'You' : 'AI Assistant'}** (${msg.timestamp.toLocaleTimeString()}):\n${msg.content}`)
        .join('\n\n---\n\n');

      const noteContent = `# Project Idea Discussion\n\n## Summary\n${ideaSummary}\n\n## Full Conversation\n\n${conversationText}`;

      await db.createScratchpadNote({
        project_id: projectId,
        content: noteContent,
        tags: ['Project Notes', 'Idea Seed', 'AI Discussion'],
        color: '#fef3c7', // Yellow color for idea notes
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
      });

      // Call the callback with the summary
      onIdeaSelected(ideaSummary);
    } catch (error) {
      console.error('Error saving idea:', error);
      setError(error instanceof Error ? error.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  };

  const canSaveIdea = messages.length > 2; // At least one user message and one AI response

  return (
    <div className="h-full flex flex-col space-y-4 bg-background p-4 rounded-lg">
      {/* Chat Header */}
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Idea Bouncer</h3>
          <p className="text-sm text-foreground-dim">Let's explore and refine your project concept together</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-background p-4 max-h-[400px]">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-foreground-dark text-background'
                    : 'bg-muted/30'
                }`}
              >
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-background' : 'text-muted-foreground'
                }`}>{message.content}</p>
                <p className={`text-xs mt-1.5 ${
                  message.role === 'user' ? 'text-background' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1 bg-background">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your idea, ask questions, or share your thoughts..."
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-secondary"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            {canSaveIdea ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Ready to save your idea and continue?</span>
              </span>
            ) : (
              <span>Chat a bit more to develop your idea, then save and continue</span>
            )}
          </div>
          
          <button
            onClick={handleSaveIdea}
            disabled={!canSaveIdea || isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>Save Idea & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          github_username: string | null;
          twitter_username: string | null;
          website_url: string | null;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          twitter_username?: string | null;
          website_url?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          twitter_username?: string | null;
          website_url?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          workspace_layout: any;
          settings: any;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          workspace_layout?: any;
          settings?: any;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          workspace_layout?: any;
          settings?: any;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_modules: {
        Row: {
          id: string;
          project_id: string;
          module_type: string;
          position: any;
          size: any;
          config: any;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          module_type: string;
          position?: any;
          size?: any;
          config?: any;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          module_type?: string;
          position?: any;
          size?: any;
          config?: any;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      prds: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string;
          version: number;
          status: string;
          metadata: any;
          ai_generated: boolean;
          parent_id: string | null;
          change_description: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content?: string;
          version?: number;
          status?: string;
          metadata?: any;
          ai_generated?: boolean;
          parent_id?: string | null;
          change_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          content?: string;
          version?: number;
          status?: string;
          metadata?: any;
          ai_generated?: boolean;
          parent_id?: string | null;
          change_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prd_versions: {
        Row: {
          id: string;
          prd_id: string;
          version_number: number;
          title: string;
          content: string;
          change_description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prd_id: string;
          version_number: number;
          title: string;
          content: string;
          change_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prd_id?: string;
          version_number?: number;
          title?: string;
          content?: string;
          change_description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          estimated_hours: number | null;
          actual_hours: number | null;
          due_date: string | null;
          tags: string[];
          dependencies: string[];
          assignee_id: string | null;
          parent_task_id: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          due_date?: string | null;
          tags?: string[];
          dependencies?: string[];
          assignee_id?: string | null;
          parent_task_id?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          due_date?: string | null;
          tags?: string[];
          dependencies?: string[];
          assignee_id?: string | null;
          parent_task_id?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string;
          content: string;
          variables: any;
          version: number;
          is_template: boolean;
          category: string;
          tags: string[];
          usage_count: number;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string;
          content: string;
          variables?: any;
          version?: number;
          is_template?: boolean;
          category?: string;
          tags?: string[];
          usage_count?: number;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string;
          content?: string;
          variables?: any;
          version?: number;
          is_template?: boolean;
          category?: string;
          tags?: string[];
          usage_count?: number;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scratchpad_notes: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          position: any;
          size: any;
          color: string;
          font_size: number;
          is_pinned: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content: string;
          position?: any;
          size?: any;
          color?: string;
          font_size?: number;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          content?: string;
          position?: any;
          size?: any;
          color?: string;
          font_size?: number;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      roadmap_items: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: string;
          phase: string;
          start_date: string | null;
          end_date: string | null;
          progress: number;
          dependencies: string[];
          milestone: boolean;
          color: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: string;
          phase?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          dependencies?: string[];
          milestone?: boolean;
          color?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          status?: string;
          phase?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          dependencies?: string[];
          milestone?: boolean;
          color?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      secrets: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          encrypted_value: string;
          description: string;
          category: string;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          encrypted_value: string;
          description?: string;
          category?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          encrypted_value?: string;
          description?: string;
          category?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          category: string;
          workspace_layout: any;
          preview_image_url: string | null;
          is_public: boolean;
          is_featured: boolean;
          download_count: number;
          rating: number;
          rating_count: number;
          version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          category?: string;
          workspace_layout: any;
          preview_image_url?: string | null;
          is_public?: boolean;
          is_featured?: boolean;
          download_count?: number;
          rating?: number;
          rating_count?: number;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          category?: string;
          workspace_layout?: any;
          preview_image_url?: string | null;
          is_public?: boolean;
          is_featured?: boolean;
          download_count?: number;
          rating?: number;
          rating_count?: number;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      template_tags: {
        Row: {
          id: string;
          template_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          tag?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      encrypt_secret: {
        Args: {
          secret_text: string;
          project_uuid: string;
        };
        Returns: string;
      };
      decrypt_secret: {
        Args: {
          encrypted_text: string;
          project_uuid: string;
        };
        Returns: string;
      };
      get_prd_version_comparison: {
        Args: {
          prd_uuid: string;
          version_a: number;
          version_b: number;
        };
        Returns: {
          version_a_data: any;
          version_b_data: any;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
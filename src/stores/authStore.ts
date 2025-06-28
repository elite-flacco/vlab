import { create } from 'zustand';
import { User } from '../types';
import { auth, supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    console.log('🔐 AuthStore: Starting sign in for:', email);
    set({ loading: true, error: null });
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) throw error;
      
      if (data.user) {
        // Construct User object with proper field mapping
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 
                data.user.user_metadata?.full_name || 
                data.user.email?.split('@')[0] || 
                'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };
        
        console.log('✅ AuthStore: Sign in successful for:', user.email);
        set({ user, loading: false });
      } else {
        console.log('❌ AuthStore: No user object in response');
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('❌ AuthStore: Sign in error:', error);
      set({ error: error.message, loading: false });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    console.log('🔐 AuthStore: Starting sign up for:', email);
    set({ loading: true, error: null });
    try {
      const { data, error } = await auth.signUp(email, password, name);
      
      if (error) throw error;
      
      if (data.user) {
        // Construct User object with proper field mapping
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 
                data.user.user_metadata?.full_name || 
                name || 
                data.user.email?.split('@')[0] || 
                'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };
        
        console.log('✅ AuthStore: Sign up successful for:', user.email);
        set({ user, loading: false });
      } else {
        console.log('❌ AuthStore: No user object in response');
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('❌ AuthStore: Sign up error:', error);
      set({ error: error.message, loading: false });
    }
  },

  signOut: async () => {
    console.log('🔐 AuthStore: Starting sign out');
    set({ loading: true });
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      console.log('✅ AuthStore: Sign out successful');
      set({ user: null, loading: false });
    } catch (error: any) {
      console.error('❌ AuthStore: Sign out error:', error);
      set({ error: error.message, loading: false });
    }
  },

  updatePassword: async (newPassword: string) => {
    console.log('🔐 AuthStore: Starting password update');
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      console.log('✅ AuthStore: Password updated successfully');
      set({ loading: false });
    } catch (error: any) {
      console.error('❌ AuthStore: Password update error:', error);
      set({ error: error.message, loading: false });
      throw error; // Re-throw so the component can handle it
    }
  },

  initialize: async () => {
    // Only log if we're actually loading (not just checking again)
    const { loading } = get();
    if (loading) {
      console.log('🔐 AuthStore: Initializing auth state');
    }
    
    try {
      const { data, error } = await auth.getCurrentUser();
      
      if (error) {
        // Don't treat "Auth session missing!" as an error - it's a normal state when no user is logged in
        if (error.message === 'Auth session missing!') {
          // Only log once when we first detect no session
          if (loading) {
            console.log('🔐 AuthStore: No active session found');
          }
          set({ user: null, loading: false, error: null });
          return;
        }
        
        console.error('❌ AuthStore: Initialize error:', error);
        set({ user: null, loading: false, error: error.message });
        return;
      }
      
      if (data.user) {
        // Construct User object with proper field mapping
        const mappedUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 
                data.user.user_metadata?.full_name || 
                data.user.email?.split('@')[0] || 
                'User',
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };
        
        // Only log if this is a new user or we're loading
        if (loading || !get().user) {
          console.log('✅ AuthStore: User session restored for:', mappedUser.email);
        }
        set({ user: mappedUser, loading: false });
      } else {
        // Only log once when we first detect no user
        if (loading) {
          console.log('🔐 AuthStore: No user session found');
        }
        set({ user: null, loading: false });
      }
    } catch (error: any) {
      console.error('❌ AuthStore: Initialize error:', error);
      set({ error: error.message, loading: false, user: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Initialize auth state on app start
auth.onAuthStateChange((event, session) => {
  // Only log significant auth events, not every state check
  if (event !== 'TOKEN_REFRESHED') {
    console.log('🔐 AuthStore: Auth event:', event, session ? 'with session' : 'no session');
  }
  const { initialize } = useAuthStore.getState();
  initialize();
});
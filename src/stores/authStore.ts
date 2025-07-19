import { create } from 'zustand';
import { User } from '../types';
import { auth, supabase } from '../lib/supabase';

// Stricter email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Client-side validation functions
const validateSignInInput = (email: string, password: string): string | null => {
  if (!email.trim()) {
    return 'Email address is required';
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  
  if (!password) {
    return 'Password is required';
  }
  
  return null;
};

const validateSignUpInput = (email: string, password: string, name: string): string | null => {
  if (!name.trim()) {
    return 'Full name is required';
  }
  
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  
  if (!email.trim()) {
    return 'Email address is required';
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  
  return null;
};

// Map Supabase errors to user-friendly messages
const mapSupabaseError = (error: any): string => {
  const message = error?.message || '';
  const code = error?.code || '';
  
  console.log('🔐 AuthStore: Mapping Supabase error:', { message, code, error });
  
  // Check for specific error patterns
  if (message.includes('User already registered') || 
      message.includes('already registered') ||
      code === 'signup_disabled' ||
      message.includes('duplicate')) {
    return 'An account with this email address already exists';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link to activate your account before signing in.';
  }
  
  if (message.includes('Invalid login credentials') ||
      message.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('Password should be at least') ||
      message.includes('weak password') ||
      code === 'weak_password') {
    return 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  
  if (message.includes('invalid email') ||
      message.includes('email format') ||
      code === 'invalid_email') {
    return 'Please enter a valid email address';
  }
  
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('timeout') ||
      code === 'network_error') {
    return 'Connection problem. Please check your internet and try again.';
  }
  
  if (message.includes('rate limit') ||
      code === 'too_many_requests') {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  
  if (message.includes('signup_disabled')) {
    return 'Account registration is currently disabled. Please contact support.';
  }
  
  // If we can't map the error, return a generic message but log the original
  console.warn('🔐 AuthStore: Unmapped Supabase error:', error);
  return 'Authentication failed. Please try again or contact support if the problem continues.';
};

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
    
    // Client-side validation
    const validationError = validateSignInInput(email, password);
    if (validationError) {
      set({ error: validationError, loading: false });
      return;
    }
    
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        const friendlyError = mapSupabaseError(error);
        throw new Error(friendlyError);
      }
      
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
    
    // Client-side validation
    const validationError = validateSignUpInput(email, password, name);
    if (validationError) {
      set({ error: validationError, loading: false });
      return;
    }
    
    try {
      const { data, error } = await auth.signUp(email, password, name);
      
      if (error) {
        const friendlyError = mapSupabaseError(error);
        throw new Error(friendlyError);
      }
      
      if (data.user) {
        // Check if this is an existing user (Supabase returns user without creating new account)
        const isExistingUser = data.user.email_confirmed_at !== null && !data.session;
        
        if (isExistingUser) {
          console.log('👤 AuthStore: User already exists for:', data.user.email);
          set({ 
            user: null, 
            loading: false,
            error: 'An account with this email address already exists'
          });
        } else {
          // Check if email confirmation is required for new user
          const needsEmailConfirmation = !data.session || data.user.email_confirmed_at === null;
          
          if (needsEmailConfirmation) {
            console.log('📧 AuthStore: Sign up successful, email confirmation required for:', data.user.email);
            // Don't set user in store, show confirmation message instead
            set({ 
              user: null, 
              loading: false,
              error: 'Please check your email and click the confirmation link to activate your account.'
            });
          } else {
            // User is fully registered and confirmed
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
          }
        }
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
      
      // Clear all project data when signing out
      const { clearProjects } = await import('./projectStore').then(m => m.useProjectStore.getState());
      clearProjects();
      
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
          
          // Clear projects when no session is found (user logged out)
          const { clearProjects } = await import('./projectStore').then(m => m.useProjectStore.getState());
          clearProjects();
          
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
        
        // Clear projects when no user is found
        const { clearProjects } = await import('./projectStore').then(m => m.useProjectStore.getState());
        clearProjects();
        
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
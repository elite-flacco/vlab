import { create } from "zustand";
import { User } from "../types";
import { auth, supabase } from "../lib/supabase";

// Stricter email validation regex
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Client-side validation functions
const validateSignInInput = (
  email: string,
  password: string,
): string | null => {
  if (!email.trim()) {
    return "Email address is required";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address";
  }

  if (!password) {
    return "Password is required";
  }

  return null;
};

const validateSignUpInput = (
  email: string,
  password: string,
  name: string,
): string | null => {
  if (!name.trim()) {
    return "Full name is required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long";
  }

  if (!email.trim()) {
    return "Email address is required";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address";
  }

  if (!password) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters with uppercase, lowercase, and numbers";
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
  }

  return null;
};

// Map Supabase errors to user-friendly messages
const mapSupabaseError = (error: Error | unknown): string => {
  const message = (error as any)?.message || "";
  const code = (error as any)?.code || "";

  // Check for specific error patterns
  if (
    message.includes("User already registered") ||
    message.includes("already registered") ||
    code === "signup_disabled" ||
    message.includes("duplicate")
  ) {
    return "An account with this email address already exists";
  }

  if (message.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link to activate your account before signing in.";
  }

  if (
    message.includes("Invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (
    message.includes("Password should be at least") ||
    message.includes("weak password") ||
    code === "weak_password"
  ) {
    return "Password must be at least 8 characters with uppercase, lowercase, and numbers";
  }

  if (
    message.includes("invalid email") ||
    message.includes("email format") ||
    code === "invalid_email"
  ) {
    return "Please enter a valid email address";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    code === "network_error"
  ) {
    return "Connection problem. Please check your internet and try again.";
  }

  if (message.includes("rate limit") || code === "too_many_requests") {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  if (message.includes("signup_disabled")) {
    return "Account registration is currently disabled. Please contact support.";
  }

  // If we can't map the error, return a generic message but log the original
  console.warn("🔐 AuthStore: Unmapped Supabase error:", error);
  return "Authentication failed. Please try again or contact support if the problem continues.";
};

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  claimAccount: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
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
          email: data.user.email || "",
          name:
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "User",
          avatar_url: data.user.user_metadata?.avatar_url,
          is_anonymous: data.user.user_metadata?.is_anonymous === "true",
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };

        set({ user, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
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
        // Supabase will send a confirmation email regardless, so we should show success message
        // The user will need to confirm their email to complete registration
        const needsEmailConfirmation =
          !data.session || data.user.email_confirmed_at === null;

        if (needsEmailConfirmation) {
          set({
            user: null,
            loading: false,
            error:
              "Account created! Please check your email and click the confirmation link to activate your account.",
          });
        } else {
          // User is fully registered and confirmed (rare case for immediate confirmation)
          const user: User = {
            id: data.user.id,
            email: data.user.email || "",
            name:
              data.user.user_metadata?.name ||
              data.user.user_metadata?.full_name ||
              name ||
              data.user.email?.split("@")[0] ||
              "User",
            avatar_url: data.user.user_metadata?.avatar_url,
            is_anonymous: false,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
          };

          set({ user, loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  signInAnonymously: async () => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await auth.signInAnonymously();

      if (error) {
        const friendlyError = mapSupabaseError(error);
        throw new Error(friendlyError);
      }

      if (data.user) {
        // For anonymous users, we need to fetch profile data to get the is_anonymous flag
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const user: User = {
            id: data.user.id,
            email: profileData?.email || data.user.email || "",
            name:
              profileData?.name ||
              data.user.user_metadata?.name ||
              "Guest User",
            avatar_url:
              data.user.user_metadata?.avatar_url || profileData?.avatar_url,
            is_anonymous: profileData?.is_anonymous ?? true,
            anonymous_claimed_at: profileData?.anonymous_claimed_at,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
          };

          set({ user, loading: false });
        } catch (profileError) {
          console.error(
            "Failed to fetch profile data for anonymous user:",
            profileError,
          );
          // Fallback to basic user object
          const user: User = {
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.name || "Guest User",
            avatar_url: data.user.user_metadata?.avatar_url,
            is_anonymous: true,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
          };

          set({ user, loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  claimAccount: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });

    // Client-side validation
    const validationError = validateSignUpInput(email, password, name);
    if (validationError) {
      set({ error: validationError, loading: false });
      return;
    }

    try {
      // Get the current anonymous user ID before claiming
      const { user: currentUser } = get();
      if (!currentUser || !currentUser.is_anonymous) {
        throw new Error("No anonymous user found to claim");
      }

      const anonymousUserId = currentUser.id;

      // Create the new account (this will sign out the anonymous user)
      const response = await auth.claimAnonymousAccount(email, password, name);

      if (response.error) {
        const friendlyError = mapSupabaseError(response.error);
        throw new Error(friendlyError);
      }

      const { data } = response;
      if (data?.user) {
        // Check if email confirmation is needed
        const needsEmailConfirmation =
          !data.session || data.user.email_confirmed_at === null;

        console.log("🔍 Claim Debug:", {
          hasSession: !!data.session,
          emailConfirmedAt: data.user.email_confirmed_at,
          needsEmailConfirmation,
          anonymousUserId,
          newUserId: data.user.id,
        });

        // Always store claiming info for now (we'll clean it up if not needed)
        // Use localStorage instead of sessionStorage so it persists across tabs
        localStorage.setItem(
          "claiming_data",
          JSON.stringify({
            anonymousUserId,
            newUserId: data.user.id,
            claimedAt: new Date().toISOString(),
          }),
        );

        if (needsEmailConfirmation) {
          // Keep anonymous user logged in and show confirmation message
          set({
            loading: false,
            error:
              "Account created! Please check your email and click the confirmation link. Your anonymous data will be automatically transferred once you verify your email.",
          });
        } else {
          // User is confirmed, transfer data immediately
          try {
            await supabase.rpc("claim_anonymous_account", {
              anonymous_user_id: anonymousUserId,
              new_user_id: data.user.id,
            });

            const user: User = {
              id: data.user.id,
              email: data.user.email || email,
              name: data.user.user_metadata?.name || name,
              avatar_url: data.user.user_metadata?.avatar_url,
              is_anonymous: false,
              anonymous_claimed_at: new Date().toISOString(),
              created_at: data.user.created_at,
              updated_at: data.user.updated_at || data.user.created_at,
            };

            set({
              user,
              loading: false,
              error: "Account successfully claimed and data transferred!",
            });
          } catch (transferError) {
            console.error("Failed to transfer data:", transferError);
            set({
              user: null,
              loading: false,
              error:
                "Account created but data transfer failed. Please contact support.",
            });
          }
        }
      } else {
        set({ loading: false });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await auth.signOut();
      if (error) {
        console.warn(
          "🔐 AuthStore: SignOut error (continuing with cleanup):",
          error,
        );
        // Continue with cleanup even if Supabase signOut fails
      }

      // Clear all project data when signing out
      const { clearProjects } = await import("./projectStore").then((m) =>
        m.useProjectStore.getState(),
      );
      clearProjects();

      set({ user: null, loading: false });
    } catch (error: Error | unknown) {
      console.error("🔐 AuthStore: SignOut failed:", error);
      // Still clear local state even if signOut failed
      const { clearProjects } = await import("./projectStore").then((m) =>
        m.useProjectStore.getState(),
      );
      clearProjects();
      set({ user: null, loading: false });
    } finally {
      // Always redirect regardless of signOut success/failure
      window.location.href = "/";
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      set({ loading: false });
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
      throw error; // Re-throw so the component can handle it
    }
  },

  initialize: async () => {
    // Only log if we're actually loading (not just checking again)
    const { loading } = get();
    if (loading) {
      console.log("🔐 AuthStore: Initializing auth state");
    }

    try {
      const { data, error } = await auth.getCurrentUser();

      if (error) {
        // Don't treat "Auth session missing!" as an error - it's a normal state when no user is logged in
        if (error.message === "Auth session missing!") {
          // Only log once when we first detect no session
          if (loading) {
            console.log("🔐 AuthStore: No active session found");
          }

          // Clear projects when no session is found (user logged out)
          const { clearProjects } = await import("./projectStore").then((m) =>
            m.useProjectStore.getState(),
          );
          clearProjects();

          set({ user: null, loading: false, error: null });
          return;
        }

        // Handle case where user was deleted but session still exists
        if (
          error.message?.includes(
            "User from sub claim in JWT does not exist",
          ) ||
          error.message?.includes("does not exist")
        ) {
          console.log("🔐 AuthStore: User no longer exists, clearing session");

          // Clear the invalid session
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.warn(
              "🔐 AuthStore: Error clearing invalid session:",
              signOutError,
            );
          }

          // Clear projects and state
          const { clearProjects } = await import("./projectStore").then((m) =>
            m.useProjectStore.getState(),
          );
          clearProjects();

          set({ user: null, loading: false, error: null });
          return;
        }

        console.error("❌ AuthStore: Initialize error:", error);
        set({ user: null, loading: false, error: error.message });
        return;
      }

      if (data.user) {
        // Fetch profile data to get complete user information including is_anonymous
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          // Check if this user just signed in after claiming an anonymous account
          const claimingData = localStorage.getItem("claiming_data");
          if (claimingData && !profileData?.is_anonymous) {
            try {
              const { anonymousUserId, newUserId } = JSON.parse(claimingData);
              if (newUserId === data.user.id) {
                // Transfer the data from anonymous account
                await supabase.rpc("claim_anonymous_account", {
                  anonymous_user_id: anonymousUserId,
                  new_user_id: newUserId,
                });

                // Clear the claiming data
                localStorage.removeItem("claiming_data");

                console.log(
                  "✅ Successfully transferred data from anonymous account",
                );
              }
            } catch (transferError) {
              console.error(
                "Failed to transfer anonymous data:",
                transferError,
              );
              // Don't fail the login, just log the error
            }
          }

          const mappedUser: User = {
            id: data.user.id,
            email: profileData?.email || data.user.email || "",
            name:
              profileData?.name ||
              data.user.user_metadata?.name ||
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            avatar_url:
              data.user.user_metadata?.avatar_url || profileData?.avatar_url,
            is_anonymous: profileData?.is_anonymous ?? false,
            anonymous_claimed_at: profileData?.anonymous_claimed_at,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
          };

          set({ user: mappedUser, loading: false });
        } catch (profileError) {
          console.error("Failed to fetch profile data:", profileError);
          // Fallback to basic user object without profile data
          const mappedUser: User = {
            id: data.user.id,
            email: data.user.email || "",
            name:
              data.user.user_metadata?.name ||
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            avatar_url: data.user.user_metadata?.avatar_url,
            is_anonymous: data.user.user_metadata?.is_anonymous === "true",
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
          };

          set({ user: mappedUser, loading: false });
        }
      } else {
        // Only log once when we first detect no user
        if (loading) {
          console.log("🔐 AuthStore: No user session found");
        }

        // Clear projects when no user is found
        const { clearProjects } = await import("./projectStore").then((m) =>
          m.useProjectStore.getState(),
        );
        clearProjects();

        set({ user: null, loading: false });
      }
    } catch (error: Error | unknown) {
      console.error("❌ AuthStore: Initialize error:", error);
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
        user: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Initialize auth state on app start
auth.onAuthStateChange((event, session) => {
  // Only log significant auth events, not every state check
  if (event !== "TOKEN_REFRESHED") {
    console.log(
      "🔐 AuthStore: Auth event:",
      event,
      session ? "with session" : "no session",
    );
  }
  const { initialize } = useAuthStore.getState();
  initialize();
});

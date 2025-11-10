// Google Analytics 4 utilities for VLab

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * Initialize Google Analytics if measurement ID is provided
 */
export const initializeAnalytics = (): void => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId || typeof window === "undefined") {
    return;
  }

  // Load GA script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize GA
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    respect_dnt: true,
  });
};

/**
 * Check if Google Analytics is loaded and enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return !!(
    import.meta.env.VITE_GA_MEASUREMENT_ID &&
    typeof window !== "undefined" &&
    window.gtag
  );
};

/**
 * Track page views (automatically called by React Router)
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isAnalyticsEnabled()) return;

  window.gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, unknown>,
): void => {
  if (!isAnalyticsEnabled()) return;

  window.gtag("event", eventName, {
    custom_parameter: true,
    ...parameters,
  });
};

/**
 * VLab-specific event tracking functions
 */
export const analytics = {
  // Authentication events
  trackSignUp: (method: "email" | "oauth" = "email") => {
    trackEvent("sign_up", { method });
  },

  trackSignIn: (method: "email" | "oauth" = "email") => {
    trackEvent("login", { method });
  },

  trackSignOut: () => {
    trackEvent("sign_out");
  },

  // Project events
  trackProjectCreated: (projectId?: string) => {
    trackEvent("project_created", { project_id: projectId });
  },

  trackProjectDeleted: () => {
    trackEvent("project_deleted");
  },

  // Module usage events
  trackModuleVisit: (moduleType: string, projectId?: string) => {
    trackEvent("module_visit", {
      module_type: moduleType,
      project_id: projectId,
    });
  },

  // Kickoff flow events
  trackKickoffStarted: (projectId?: string) => {
    trackEvent("kickoff_started", { project_id: projectId });
  },

  trackKickoffCompleted: (projectId?: string) => {
    trackEvent("kickoff_completed", { project_id: projectId });
  },

  // AI feature usage
  trackAITaskGeneration: (
    source: "prd" | "roadmap" | "design" | "scratchpad",
    taskCount?: number,
  ) => {
    trackEvent("ai_task_generation", {
      source,
      task_count: taskCount,
    });
  },

  trackAIContentGeneration: (type: "prd" | "roadmap" | "idea_summary") => {
    trackEvent("ai_content_generation", { content_type: type });
  },

  trackDesignAnalysis: (type: "text" | "image") => {
    trackEvent("design_analysis", { analysis_type: type });
  },

  // Feature adoption
  trackFeatureUsed: (
    featureName: string,
    metadata?: Record<string, unknown>,
  ) => {
    trackEvent("feature_used", {
      feature_name: featureName,
      ...metadata,
    });
  },

  // Early access tracking
  trackEarlyAccessSignup: (accessCode: string) => {
    trackEvent("early_access_signup", {
      access_code: accessCode === "VIBEEARLY" ? "valid" : "invalid",
    });
  },

  // Error tracking
  trackError: (errorType: string, errorMessage?: string) => {
    trackEvent("error_occurred", {
      error_type: errorType,
      error_message: errorMessage,
    });
  },
};

/**
 * Set user properties (for authenticated users)
 */
export const setUserProperties = (
  properties: Record<string, unknown>,
): void => {
  if (!isAnalyticsEnabled()) return;

  window.gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
    custom_map: properties,
  });
};

/**
 * Set user ID (for authenticated users)
 */
export const setUserId = (userId: string): void => {
  if (!isAnalyticsEnabled()) return;

  window.gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
    user_id: userId,
  });
};

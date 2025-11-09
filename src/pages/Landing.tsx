import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ErrorMessage } from "../components/Auth/ErrorMessage";
import {
  Terminal,
  Code,
  Zap,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Mail,
} from "lucide-react";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "../components/ErrorBoundary/ErrorBoundary";

interface LandingProps {
  showForAuthenticated?: boolean;
}

export const Landing: React.FC<LandingProps> = ({
  showForAuthenticated = false,
}) => {
  const navigate = useNavigate();
  const {
    signUp,
    signIn,
    signInAnonymously,
    loading,
    error,
    clearError,
    user,
  } = useAuthStore();

  // Check if we're being opened for signup from anonymous user
  const urlParams = new URLSearchParams(window.location.search);
  const isSignupMode = urlParams.has("signup");
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    message: "",
  });
  const [terminalText, setTerminalText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(
    new Set(),
  );
  const [animatedFeatures, setAnimatedFeatures] = useState<Set<number>>(
    new Set(),
  );
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  const features = [
    {
      code: "project.create()",
      desc: "Kickstart with AI",
      info: "Brainstorm with AI to spark ideas and set a strong foundation for your next build.",
      staticImage: "/screenshots/ideate-static.png",
      gifImage: "/gifs/ideate-demo.gif",
      alt: "Ideation Demo",
    },
    {
      code: "prd.generate()",
      desc: "From ideas to PRD in seconds",
      info: "Turn your messy thoughts into a clean, structured Product Requirements Document — powered by AI and ready to guide your build.",
      staticImage: "/screenshots/prd-static.png",
      gifImage: "/gifs/prd-demo.gif",
      alt: "PRD Generation Demo",
    },
    {
      code: "roadmap.plan()",
      desc: "Plan smart, move fast",
      info: "Instantly generate multi-phase roadmaps from your PRD. Stay focused, see the big picture, and build in clear steps.",
      staticImage: "/screenshots/roadmap-static.png",
      gifImage: "/gifs/roadmap-demo.gif",
      alt: "Roadmap Planning Demo",
    },
    {
      code: "tasks.automate()",
      desc: "Auto-task your roadmap",
      info: "Convert each roadmap phase into clear, actionable tasks — complete with priorities, tags, and no mental load.",
      staticImage: "/screenshots/tasks-static.png",
      gifImage: "/gifs/tasks-demo.gif",
      alt: "Task Automation Demo",
    },
    {
      code: "workspace.sync()",
      desc: "One workspace to rule it all",
      info: "All your tools — PRDs, roadmaps, tasks, notes, and designs — synced in a single, streamlined dashboard.",
      staticImage: "/screenshots/workspace-static.png",
      gifImage: "/gifs/workspace-demo.gif",
      alt: "Unified Workspace Demo",
    },
    {
      code: "scratchpad.ideate()",
      desc: "Jot now, code later",
      info: "Drop your ideas, thoughts, or random sparks in a clean space. Turn them into tasks anytime with text-to-task conversion.",
      staticImage: "/screenshots/scratchpad-static.png",
      gifImage: "/gifs/scratchpad-demo.gif",
      alt: "Scratchpad Demo",
    },
    {
      code: "design.copilot()",
      desc: "Design with an AI partner",
      info: "Upload a screenshot, get instant UX feedback, and generate design tasks — your AI co-designer’s got your back.",
      staticImage: "/screenshots/design-static.png",
      gifImage: "/gifs/design-demo.gif",
      alt: "Design Assistant Demo",
    },
    {
      code: "community.join()",
      desc: "Build with your people",
      info: "Swap tips, workflows, and lessons learned with other builders mastering the vibe coding way. Learn faster, ship smarter.",
      staticImage: "/screenshots/community-static.png",
      // gifImage: '/gifs/community-demo.gif',
      alt: "Community Demo",
    },
  ];

  // Redirect if already authenticated (unless showForAuthenticated is true or in signup mode)
  useEffect(() => {
    if (user && !showForAuthenticated && !isSignupMode) {
      // Get the intended destination from sessionStorage or use dashboard as default
      const returnUrl = sessionStorage.getItem("returnUrl") || "/";
      sessionStorage.removeItem("returnUrl"); // Clean up
      navigate(returnUrl);
    }
  }, [user, navigate, showForAuthenticated, isSignupMode]);

  // Terminal animation effect
  useEffect(() => {
    const text = showForAuthenticated
      ? "> displaying VLab features..."
      : "> initializing project workspace...";
    let index = 0;

    const typeWriter = () => {
      if (index < text.length) {
        setTerminalText(text.slice(0, index + 1));
        index++;
        setTimeout(typeWriter, 100);
      }
    };

    typeWriter();

    // Cursor blink effect
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [showForAuthenticated]);

  // Auto-scroll to signup section if in signup mode
  useEffect(() => {
    if (isSignupMode) {
      setTimeout(() => {
        scrollToSection("signup");
      }, 500);
    }
  }, [isSignupMode]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    featureRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisibleFeatures((prev) => new Set([...prev, index]));
              // Start GIF animation after 1.5 seconds only if GIF exists
              if (features[index]?.gifImage) {
                setTimeout(() => {
                  setAnimatedFeatures((prev) => new Set([...prev, index]));
                }, 1500);
              }
            } else {
              setVisibleFeatures((prev) => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
              });
              setAnimatedFeatures((prev) => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
              });
            }
          },
          {
            threshold: 0.3,
            rootMargin: "-100px 0px",
          },
        );

        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [features.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialScrollY = window.scrollY;
    clearError();

    if (isSignUp) {
      await signUp(formData.email, formData.password, formData.name);

      // Restore scroll position after signup to prevent unwanted scroll-to-top
      // Only restore if we actually jumped to top and have form data
      if (window.scrollY === 0 && initialScrollY > 0 && formData.email) {
        window.scrollTo({ top: initialScrollY, behavior: "instant" });
      }
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSwitchToLogin = () => {
    setIsSignUp(false);
    clearError();
    setFormData({ ...formData, password: "", name: "", message: "" });
  };

  const handleRetry = () => {
    clearError();
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setFormData({ email: "", password: "", name: "", message: "" });
  };

  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTryItNow = async () => {
    try {
      await signInAnonymously();
      navigate("/");
    } catch (error) {
      console.error("Anonymous sign in failed:", error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-mono overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(0, 255, 159, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 159, 0.1) 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-foreground-dim/20 bg-background/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold">VLab</span>
                </div>
                <nav className="hidden md:flex items-center space-x-6 text-sm">
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-primary transition-colors"
                  >
                    Core Modules
                  </button>
                  {!showForAuthenticated && (
                    <button
                      onClick={() => scrollToSection("signup")}
                      className="hover:text-primary transition-colors flex items-center space-x-1"
                    >
                      <span>Start Vib'ing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="relative px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Terminal Animation */}
              <div className="mb-8 p-4 bg-secondary/50 border border-foreground-dim/20 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2 text-xs text-foreground-dim">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2">terminal</span>
                </div>
                <div className="text-left text-sm">
                  <span className="text-primary">{terminalText}</span>
                  <span
                    className={`text-primary ${showCursor ? "opacity-100" : "opacity-0"} transition-opacity`}
                  >
                    _
                  </span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 mt-16 leading-tight">
                <span className="text-foreground">Build</span>{" "}
                <span className="text-primary glow">Smarter</span>
                <br />
                <span className="text-foreground">Ship</span>{" "}
                <span className="text-primary glow">Faster</span>
              </h1>

              {/* Value Proposition */}
              <p className="text-lg md:text-xl text-foreground-dim mb-8 max-w-2xl mx-auto leading-relaxed">
                // built_for_(
                <span className="text-primary">solo_vibe_coders</span>)
                <br />A minimalist, AI-powered all-in-one workspace for chaotic
                builders.
              </p>

              {/* CTA Button - only show for unauthenticated users (not on /about page) */}
              {!user && !showForAuthenticated && (
                <button
                  onClick={() => scrollToSection("signup")}
                  className="inline-flex items-center px-8 py-4 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 hover:text-background"
                >
                  <span>&gt;_ Start Vib'ing</span>
                </button>
              )}
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="px-6 py-20 bg-secondary/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-primary">//</span> Core Modules
                </h2>
                <p className="text-foreground-dim text-lg max-w-2xl mx-auto">
                  Essential tools designed to help you level up your vibe coding
                  — from idea spark to shipping in flow.
                </p>
              </div>

              <div className="space-y-16 md:space-y-24 lg:space-y-32">
                {features.map((feature, index) => {
                  const isEven = index % 2 === 0;
                  const isVisible = visibleFeatures.has(index);
                  const isAnimated = animatedFeatures.has(index);
                  const hasGif = !!feature.gifImage;
                  return (
                    <div
                      key={index}
                      ref={(el) => (featureRefs.current[index] = el)}
                      className={`flex flex-col ${
                        isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                      } items-center gap-8 md:gap-12 lg:gap-20 transition-all duration-1000 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-8 md:translate-y-16"
                      }`}
                    >
                      {/* Content Side */}
                      <div
                        className={`flex-1 space-y-6 transition-all duration-1000 delay-200 ${
                          isEven ? "lg:text-right text-left" : "text-left"
                        } ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : `opacity-0 lg:${isEven ? "-translate-x-8" : "translate-x-8"}`
                        }`}
                      >
                        <div
                          className={`flex items-center space-x-3 ${
                            isEven
                              ? "lg:flex-row-reverse lg:space-x-reverse"
                              : ""
                          }`}
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Code className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-sm text-foreground-dim font-mono">
                            {feature.code.split(".")[0]}.module
                          </span>
                        </div>

                        <div>
                          <code className="text-primary text-2xl md:text-3xl font-bold block mb-4 font-mono">
                            {feature.code}
                          </code>
                          <h3 className="text-foreground text-xl md:text-xl font-semibold mb-4 leading-tight">
                            {feature.desc}
                          </h3>
                          <p className="text-foreground-dim text-base leading-relaxed mb-6 opacity-90">
                            {feature.info}
                          </p>
                          <div
                            className={`flex items-center space-x-2 text-sm text-primary ${
                              isEven
                                ? "lg:flex-row-reverse lg:space-x-reverse"
                                : ""
                            }`}
                          >
                            {/* <ArrowRight className="w-4 h-4" />
                            <span>Explore {feature.code.split('.')[0]}</span> */}
                          </div>
                        </div>
                      </div>

                      {/* Visual Side */}
                      <div
                        className={`flex-1 max-w-2xl transition-all duration-1000 delay-400 ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : `opacity-0 lg:${isEven ? "translate-x-8" : "-translate-x-8"}`
                        }`}
                      >
                        <div className="group relative">
                          {/* Terminal Window */}
                          <div className="bg-secondary/80 border border-foreground-dim/20 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-foreground-dim/20">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                              <span className="text-xs text-foreground-dim font-mono">
                                {feature.code.split(".")[0]}.preview
                              </span>
                              <div className="w-16"></div>
                            </div>

                            {/* Large Screenshot Container */}
                            <div className="relative bg-background p-4">
                              {/* Static Screenshot */}
                              <img
                                src={feature.staticImage}
                                alt={feature.alt}
                                className={`w-full h-auto max-h-80 md:max-h-96 object-contain ${
                                  hasGif
                                    ? "transition-opacity duration-700"
                                    : ""
                                } ${
                                  hasGif && isAnimated
                                    ? "opacity-0"
                                    : "opacity-100"
                                }`}
                                loading="lazy"
                              />

                              {/* Animated GIF - only render if it exists */}
                              {hasGif && (
                                <img
                                  src={feature.gifImage}
                                  alt={`${feature.alt} - Interactive Demo`}
                                  className={`absolute inset-4 w-[calc(100%-2rem)] h-auto max-h-80 md:max-h-96 object-contain transition-opacity duration-700 ${
                                    isAnimated ? "opacity-100" : "opacity-0"
                                  }`}
                                  loading="lazy"
                                />
                              )}

                              {/* Live indicator - only show if GIF exists and is playing */}
                              {hasGif && (
                                <div
                                  className={`absolute top-6 right-6 transition-all duration-500 ${
                                    isAnimated ? "opacity-100" : "opacity-0"
                                  }`}
                                >
                                  <div className="bg-primary/90 text-background px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-background rounded-full animate-pulse"></div>
                                    <span>LIVE</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Sign-up Section - only show if not authenticated or not showing for authenticated */}
          {(!user || !showForAuthenticated) && (
            <section id="signup" className="px-6 py-20">
              <div className="max-w-md mx-auto">
                <div className="bg-secondary/50 border border-foreground-dim/20 rounded-lg p-8 backdrop-blur-sm">
                  {/* Terminal Header */}
                  <div className="flex items-center space-x-2 mb-6 text-xs text-foreground-dim">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2">auth.vibelab</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-center">
                    <span className="text-primary">$</span>{" "}
                    {isSignUp ? "create_account" : "login"}
                  </h3>

                  {/* {isSignUp && (
                  <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-center text-sm text-primary">
                      🚀 Early Access - We're in beta and looking for feedback!
                    </p>
                  </div>
                )} */}
                  {isSignUp && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleTryItNow}
                        disabled={loading}
                        className="btn-primary w-full py-3 font-semibold text-base"
                        aria-label="Try VLab without signing up"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2"></div>
                            Loading...
                          </span>
                        ) : (
                          "🚀 Try It Now - No Sign Up Required"
                        )}
                      </button>
                      <p className="text-xs text-foreground-dim mt-4">
                        Create projects and explore features instantly
                      </p>
                      <p className="text-xs text-foreground-dim mb-8">
                        Ready to commit? Sign up below!
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                      <>
                        <div>
                          <label className="block text-sm text-foreground-dim mb-2">
                            --name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter your name"
                            required={isSignUp}
                            aria-label="Full name"
                            autoComplete="name"
                          />
                        </div>
                      </>
                    )}

                    {true && (
                      <>
                        <div>
                          <label className="block text-sm text-foreground-dim mb-2">
                            --email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="user@domain.com"
                            required
                            aria-label="Email address"
                            autoComplete="email"
                          />
                        </div>
                      </>
                    )}

                    {true && (
                      <>
                        <div>
                          <label className="block text-sm text-foreground-dim mb-2">
                            --password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="••••••••"
                              required
                              aria-label="Password"
                              autoComplete={
                                isSignUp ? "new-password" : "current-password"
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-dim hover:text-foreground transition-colors"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Enhanced Error Display */}
                    {error && (
                      <ErrorMessage
                        error={error}
                        onRetry={handleRetry}
                        onSwitchToLogin={
                          isSignUp ? handleSwitchToLogin : undefined
                        }
                        className="mt-4"
                      />
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                      aria-label={isSignUp ? "Create account" : "Sign in"}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        `${isSignUp ? "deploy_user()" : "authenticate_user()"}`
                      )}
                    </button>
                  </form>

                  <div className="mt-6 space-y-4">
                    {/* Try It Now Button */}
                    {/* <div className="text-center">
                    <button
                      onClick={handleTryItNow}
                      disabled={loading}
                      className="w-full py-3 bg-secondary/80 text-foreground font-semibold rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg border border-foreground-dim/20"
                      aria-label="Try VLab without signing up"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2"></div>
                          Loading...
                        </span>
                      ) : (
                        '🚀 Try It Now - No Sign Up Required'
                      )}
                    </button>
                    <p className="text-xs text-foreground-dim mt-2">
                      Create projects and explore features instantly
                    </p>
                  </div> */}

                    {/* Mode Switch */}
                    <div className="text-center">
                      <button
                        onClick={handleModeSwitch}
                        className="text-foreground-dim hover:text-primary transition-colors text-sm"
                        aria-label={
                          isSignUp ? "Switch to login" : "Switch to sign up"
                        }
                      >
                        {isSignUp
                          ? "// Already have an account? Login"
                          : "// Need an account? Sign up"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="relative border-t border-foreground-dim/20 bg-background/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <Terminal className="w-5 h-5 text-primary" />
                  <span className="text-foreground-dim">
                    © 2025 VLab. All rights reserved.
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-foreground-dim">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="hover:text-primary transition-colors flex items-center space-x-1"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    <span>Get in touch</span>
                  </button>
                  <span className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure by design</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Zap className="w-4 h-4" />
                    <span>AI-powered</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Modal */}
            {showContactModal &&
              createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowContactModal(false)}
                  />

                  {/* Modal Content */}
                  <div className="relative w-full max-w-md bg-background rounded-xl border border-foreground-dim/20 shadow-xl">
                    <button
                      onClick={() => setShowContactModal(false)}
                      className="absolute right-4 top-4 text-foreground-dim hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="p-6">
                      <h3 className="mb-2">Get in Touch</h3>
                      <p className="text-foreground-dim mb-6">
                        Have questions, feedback or want to learn more? Drop us
                        a message at{" "}
                        <a
                          href="mailto:vibelab.feedback@gmail.com"
                          className="text-primary hover:underline"
                        >
                          vibelab.feedback@gmail.com
                        </a>
                        , let's chat!
                      </p>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

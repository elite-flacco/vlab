import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ErrorMessage } from '../components/Auth/ErrorMessage';
import { Terminal, Code, Zap, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signIn, loading, error, clearError, user } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [terminalText, setTerminalText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Terminal animation effect
  useEffect(() => {
    const text = '> initializing_vibelab.exe';
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
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isSignUp) {
      await signUp(formData.email, formData.password, formData.name);
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSwitchToLogin = () => {
    setIsSignUp(false);
    clearError();
    setFormData({ email: formData.email, password: '', name: '' });
  };

  const handleRetry = () => {
    clearError();
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setFormData({ email: '', password: '', name: '' });
  };

  const features = [
    { code: 'prd.generate()', desc: 'AI-powered documentation' },
    { code: 'roadmap.plan()', desc: 'Smart project planning' },
    { code: 'tasks.automate()', desc: 'Intelligent task breakdown' },
    { code: 'workspace.sync()', desc: 'Unified development hub' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-hidden">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 159, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 159, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-foreground-dim/20 bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">VibeLab</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6 text-sm">
                <a href="#features" className="hover:text-primary transition-colors">Features</a>
                <a href="#signup" className="hover:text-primary transition-colors">Get Started</a>
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
                <span className={`text-primary ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>_</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Build</span>{' '}
              <span className="text-primary glow">Smarter</span>
              <br />
              <span className="text-foreground">Ship</span>{' '}
              <span className="text-primary glow">Faster</span>
            </h1>

            {/* Value Proposition */}
            <p className="text-lg md:text-xl text-foreground-dim mb-8 max-w-2xl mx-auto leading-relaxed">
              The AI-powered workspace that transforms ideas into structured projects.
              <br />
              From concept to deployment, all in one terminal-inspired environment.
            </p>

            {/* CTA Button */}
            <a 
              href="#signup" 
              className="inline-flex items-center px-8 py-4 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
            >
              <span>Initialize Project</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-primary">//</span> Core Functions
              </h2>
              <p className="text-foreground-dim text-lg">Essential tools for modern development workflows</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 bg-background/50 border border-foreground-dim/20 rounded-lg hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Code className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <code className="text-primary text-lg font-semibold block mb-2">
                        {feature.code}
                      </code>
                      <p className="text-foreground-dim">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sign-up Section */}
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

              <h3 className="text-2xl font-bold mb-6 text-center">
                <span className="text-primary">$</span> {isSignUp ? 'create_account' : 'login'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm text-foreground-dim mb-2">
                      --name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background border border-foreground-dim/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      placeholder="Enter your name"
                      required={isSignUp}
                      aria-label="Full name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-foreground-dim mb-2">
                    --email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border border-foreground-dim/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    placeholder="user@domain.com"
                    required
                    aria-label="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm text-foreground-dim mb-2">
                    --password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 bg-background border border-foreground-dim/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      placeholder="••••••••"
                      required
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-dim hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced Error Display */}
                {error && (
                  <ErrorMessage
                    error={error}
                    onRetry={handleRetry}
                    onSwitchToLogin={isSignUp ? handleSwitchToLogin : undefined}
                    className="mt-4"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                  aria-label={isSignUp ? 'Create account' : 'Sign in'}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    `${isSignUp ? 'Execute' : 'Authenticate'}`
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={handleModeSwitch}
                  className="text-foreground-dim hover:text-primary transition-colors text-sm"
                  aria-label={isSignUp ? 'Switch to login' : 'Switch to sign up'}
                >
                  {isSignUp 
                    ? '// Already have an account? Login' 
                    : '// Need an account? Sign up'
                  }
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-foreground-dim/20 bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Terminal className="w-5 h-5 text-primary" />
                <span className="text-foreground-dim">VibeLab © 2025</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-foreground-dim">
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
        </footer>
      </div>
    </div>
  );
};
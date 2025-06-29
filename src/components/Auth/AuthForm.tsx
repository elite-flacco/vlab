import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ErrorMessage } from './ErrorMessage';
import { Eye, EyeOff } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const { signIn, signUp, loading, error, clearError } = useAuthStore();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome to VLab - Your Solo Vibe Coder Workspace
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div className="form-field">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isSignUp}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  aria-label="Full name"
                />
              </div>
            )}
            
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                aria-label="Email address"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <ErrorMessage
              error={error}
              onRetry={handleRetry}
              onSwitchToLogin={isSignUp ? handleSwitchToLogin : undefined}
            />
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              aria-label={isSignUp ? 'Create account' : 'Sign in'}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Sign in')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-blue-600 hover:text-blue-500 text-sm"
              aria-label={isSignUp ? 'Switch to login' : 'Switch to sign up'}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
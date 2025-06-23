import React from 'react';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onSwitchToLogin,
  className = ''
}) => {
  // Parse different types of errors and provide appropriate messaging
  const getErrorDetails = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('user already registered') || 
        lowerError.includes('email already exists') ||
        lowerError.includes('already registered') ||
        lowerError.includes('duplicate') ||
        lowerError.includes('unique constraint')) {
      return {
        type: 'existing_email',
        title: 'Account Already Exists',
        message: 'An account with this email address already exists.',
        suggestion: 'Try signing in instead, or use a different email address.',
        showLoginLink: true,
        icon: AlertCircle,
        color: 'blue'
      };
    }
    
    if (lowerError.includes('invalid email') || lowerError.includes('email format')) {
      return {
        type: 'invalid_email',
        title: 'Invalid Email Format',
        message: 'Please enter a valid email address.',
        suggestion: 'Check your email format and try again.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    if (lowerError.includes('password') && (lowerError.includes('weak') || lowerError.includes('short'))) {
      return {
        type: 'weak_password',
        title: 'Password Too Weak',
        message: 'Your password doesn\'t meet our security requirements.',
        suggestion: 'Use at least 8 characters with a mix of letters, numbers, and symbols.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('timeout')) {
      return {
        type: 'network_error',
        title: 'Connection Problem',
        message: 'We\'re having trouble connecting to our servers.',
        suggestion: 'Check your internet connection and try again.',
        showLoginLink: false,
        icon: RefreshCw,
        color: 'red'
      };
    }
    
    // Default error handling
    return {
      type: 'generic',
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected error.',
      suggestion: 'Please try again in a moment.',
      showLoginLink: false,
      icon: AlertCircle,
      color: 'red'
    };
  };

  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-800',
          suggestion: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          linkButton: 'text-blue-600 hover:text-blue-800'
        };
      case 'orange':
        return {
          container: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          title: 'text-orange-900',
          message: 'text-orange-800',
          suggestion: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          linkButton: 'text-orange-600 hover:text-orange-800'
        };
      default:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-800',
          suggestion: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          linkButton: 'text-red-600 hover:text-red-800'
        };
    }
  };

  const colors = getColorClasses(errorDetails.color);

  return (
    <div 
      className={`border rounded-lg p-4 ${colors.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <IconComponent 
            className={`w-5 h-5 ${colors.icon}`} 
            aria-hidden="true"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${colors.title} mb-1`}>
            {errorDetails.title}
          </h3>
          
          <p className={`text-sm ${colors.message} mb-2`}>
            {errorDetails.message}
          </p>
          
          <p className={`text-sm ${colors.suggestion} mb-3`}>
            {errorDetails.suggestion}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {errorDetails.showLoginLink && onSwitchToLogin && (
              <button
                onClick={onSwitchToLogin}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${colors.button}`}
                aria-label="Switch to login form"
              >
                <span>Sign In Instead</span>
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </button>
            )}
            
            {onRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-current transition-colors ${colors.linkButton}`}
                aria-label="Try again"
              >
                <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
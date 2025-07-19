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
    
    // Account already exists
    if (lowerError.includes('account with this email address already exists') ||
        lowerError.includes('account with this email') || 
        lowerError.includes('user already registered') || 
        lowerError.includes('email address already exists') ||
        lowerError.includes('email already exists') ||
        lowerError.includes('already registered') ||
        lowerError.includes('duplicate')) {
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
    
    // Invalid credentials
    if (lowerError.includes('invalid email or password') ||
        lowerError.includes('invalid login credentials') ||
        lowerError.includes('invalid credentials')) {
      return {
        type: 'invalid_credentials',
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        suggestion: 'Please check your credentials and try again.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'red'
      };
    }
    
    // Email validation
    if (lowerError.includes('valid email address') || 
        lowerError.includes('invalid email') || 
        lowerError.includes('email format') ||
        lowerError.includes('email address is required')) {
      return {
        type: 'invalid_email',
        title: 'Invalid Email',
        message: errorMessage,
        suggestion: 'Please enter a valid email address (e.g., user@example.com).',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    // Password requirements
    if (lowerError.includes('password must') || 
        lowerError.includes('password should') ||
        lowerError.includes('weak password') ||
        lowerError.includes('password is required') ||
        lowerError.includes('characters')) {
      
      // Check if the error message already contains detailed requirements
      const hasDetailedRequirements = (lowerError.includes('uppercase') && 
                                      lowerError.includes('lowercase') && 
                                      lowerError.includes('number')) ||
                                     (lowerError.includes('8 characters with'));
      
      return {
        type: 'password_requirements',
        title: 'Password Requirements',
        message: errorMessage,
        suggestion: hasDetailedRequirements ? 'Please check that your password meets all requirements above.' : 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    // Name validation
    if (lowerError.includes('name is required') || 
        lowerError.includes('name must be')) {
      return {
        type: 'invalid_name',
        title: 'Name Required',
        message: errorMessage,
        suggestion: 'Please enter your full name (at least 2 characters).',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    // Network/connection issues
    if (lowerError.includes('connection problem') ||
        lowerError.includes('network') || 
        lowerError.includes('connection') || 
        lowerError.includes('timeout') ||
        lowerError.includes('check your internet')) {
      return {
        type: 'network_error',
        title: 'Connection Problem',
        message: 'We\'re having trouble connecting to our servers.',
        suggestion: 'Please check your internet connection and try again.',
        showLoginLink: false,
        icon: RefreshCw,
        color: 'red'
      };
    }
    
    // Rate limiting
    if (lowerError.includes('too many attempts') ||
        lowerError.includes('rate limit')) {
      return {
        type: 'rate_limit',
        title: 'Too Many Attempts',
        message: 'You\'ve made too many requests in a short time.',
        suggestion: 'Please wait a moment before trying again.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'orange'
      };
    }
    
    // Authentication failed with more details
    if (lowerError.includes('authentication failed')) {
      return {
        type: 'auth_failed',
        title: 'Authentication Failed',
        message: 'We couldn\'t complete your request.',
        suggestion: 'Please try again or contact support if the problem continues.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'red'
      };
    }
    
    // Email confirmation required (success or reminder message)
    if (lowerError.includes('check your email') ||
        lowerError.includes('confirmation link') ||
        lowerError.includes('activate your account') ||
        lowerError.includes('before signing in')) {
      return {
        type: 'email_confirmation',
        title: 'Email Confirmation Required',
        message: errorMessage,
        suggestion: 'If you don\'t see the email, check your spam folder. You can also try signing up again to resend the confirmation email.',
        showLoginLink: false,
        icon: AlertCircle,
        color: 'blue'
      };
    }
    
    // Default error handling - try to use the original message if it's descriptive
    const isDescriptive = errorMessage.length > 10 && 
                         !lowerError.includes('something went wrong') &&
                         !lowerError.includes('unexpected error');
    
    return {
      type: 'generic',
      title: 'Something Went Wrong',
      message: isDescriptive ? errorMessage : 'We encountered an unexpected error.',
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
          container: 'bg-blue-500/10 border border-blue-500/20',
          icon: 'text-blue-400',
          title: 'text-blue-400',
          message: 'text-foreground',
          suggestion: 'text-foreground-dim',
          button: 'bg-blue-500 hover:bg-blue-600 text-white font-medium',
          linkButton: 'text-blue-400 hover:text-blue-300 transition-colors'
        };
      case 'orange':
        return {
          container: 'bg-warning/10 border border-warning/20',
          icon: 'text-warning',
          title: 'text-warning',
          message: 'text-foreground',
          suggestion: 'text-foreground-dim',
          button: 'bg-warning hover:bg-warning/90 text-background font-medium',
          linkButton: 'text-warning hover:text-warning/80 transition-colors'
        };
      default:
        return {
          container: 'bg-destructive/10 border border-destructive/20',
          icon: 'text-destructive',
          title: 'text-destructive',
          message: 'text-foreground',
          suggestion: 'text-foreground-dim',
          button: 'btn-danger',
          linkButton: 'text-destructive hover:text-destructive/80 transition-colors'
        };
    }
  };

  const colors = getColorClasses(errorDetails.color);

  return (
    <div 
      className={`border rounded-lg p-4 ${colors.container} ${className}`}
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
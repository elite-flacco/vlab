import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({
  children = 'Return to Workspace',
  className = '',
  ...props
}) => {
  return (
    <div className="mb-6">
      <button
        type="button"
        className={`inline-flex items-center btn-ghost ${className}`}
        {...props}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {children}
      </button>
    </div>
  );
};
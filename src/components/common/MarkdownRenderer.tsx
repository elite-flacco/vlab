import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact' | 'large';
  fontSize?: number;
  enableAutoLinks?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  variant = 'default',
  fontSize,
  enableAutoLinks = true
}) => {
  // Preprocessing function for Phase/Step formatting (from ScratchpadDetailView)
  const preprocessMarkdown = (text: string): string => {
    return text.trimStart()
      .replace(/^\s*(Phase \d+[:\-\s]*)/gm, '## $1')
      .replace(/^\s*(Step \d+[:\-\s]*)/gm, '### $1')
      .replace(/^\s*(\d+\.\s)/gm, '- ')
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      .replace(/\*(.*?)\*/g, '*$1*');
  };

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'prose-xs';
      case 'large':
        return 'prose-lg';
      default:
        return 'prose-sm';
    }
  };

  // Style object for custom font size
  const style = fontSize ? { fontSize: `${Math.max(12, fontSize)}px` } : {};

  return (
    <div
      className={`prose ${getVariantClasses()} max-w-none break-words overflow-hidden ${className}`}
      style={{ ...style, color: 'inherit' }}
    >
      <ReactMarkdown
        children={preprocessMarkdown(content)}
        components={{
          h1: (props) => <h1 className="text-lg font-semibold mt-2 mb-1 text-foreground/90" {...props} />,
          h2: (props) => <h2 className="text-base font-semibold mt-2 mb-1 text-foreground/90" {...props} />,
          h3: (props) => <h3 className="text-sm font-semibold mt-1.5 mb-1 text-foreground/90" {...props} />,
          h4: (props) => <h4 className="text-sm font-semibold mt-1.5 mb-1 text-foreground/90" {...props} />,
          h5: (props) => <h5 className="text-xs font-semibold mt-1 mb-1 text-foreground/90" {...props} />,
          h6: (props) => <h6 className="text-xs font-medium mt-1 mb-1 text-foreground/90" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 space-y-1 my-1" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 space-y-1 my-1" {...props} />,
          li: (props) => <li className="pl-1 text-foreground/80" {...props} />,
          p: (props) => <p className="text-xs my-1.5 text-foreground-muted" {...props} />,
          strong: (props) => <strong className="font-semibold text-foreground/90" {...props} />,
          em: (props) => <em className="italic text-foreground/80" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-foreground/20 pl-4 italic text-foreground/70 my-2" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code className="bg-foreground/10 px-1 py-0.5 rounded text-xs font-mono text-foreground/90" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-foreground/10 p-2 rounded-md overflow-x-auto my-2 max-w-full">
                <code className="text-xs font-mono text-foreground/90" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          a: (props) => {
            // Handle auto-detected URLs if enableAutoLinks is true
            if (enableAutoLinks) {
              return (
                <a
                  className="text-primary hover:underline break-all transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              );
            }
            return (
              <a
                className="text-primary hover:underline break-all transition-colors"
                {...props}
              />
            );
          },
          hr: (props) => <hr className="border-foreground/20 my-4" {...props} />,
          table: (props) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-foreground/20" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="border border-foreground/20 px-2 py-1 bg-foreground/5 font-semibold text-xs text-foreground/90" {...props} />
          ),
          td: (props) => (
            <td className="border border-foreground/20 px-2 py-1 text-xs text-foreground/80" {...props} />
          ),
        }}
      />
    </div>
  );
};

// Utility function to detect and convert URLs to markdown links
export const convertUrlsToMarkdown = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '[$1]($1)');
};

// Export a hook for common markdown processing
export const useMarkdownPreprocessing = () => {
  const processContent = React.useCallback((content: string, options?: { convertUrls?: boolean }) => {
    let processed = content;

    if (options?.convertUrls) {
      processed = convertUrlsToMarkdown(processed);
    }

    return processed;
  }, []);

  return { processContent };
};
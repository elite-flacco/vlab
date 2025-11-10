import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: "default" | "compact" | "large";
  fontSize?: number;
  enableAutoLinks?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  variant = "default",
  fontSize,
  enableAutoLinks = true,
}) => {
  // Preprocessing function for Phase/Step formatting (from ScratchpadDetailView)
  const preprocessMarkdown = (text: string): string => {
    return (
      text
        .trimStart()
        .replace(/^\s*(Phase \d+[:\-\s]*)/gm, "## $1")
        .replace(/^\s*(Step \d+[:\-\s]*)/gm, "### $1")
        // Convert lines that start with "Phase X." or "Step X." to bullet points
        .replace(/^\s*(Phase \d+\.\s)/gim, "- $1")
        .replace(/^\s*(Step \d+\.\s)/gim, "- $1")
        .replace(/\*\*(.*?)\*\*/g, "**$1**")
        .replace(/\*(.*?)\*/g, "*$1*")
    );
  };

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "prose-xs";
      case "large":
        return "prose-lg";
      default:
        return "prose-sm";
    }
  };

  // Style object for custom font size
  const style = fontSize ? { fontSize: `${Math.max(12, fontSize)}px` } : {};

  return (
    <div
      className={`prose ${getVariantClasses()} max-w-none break-words overflow-hidden ${className}`}
      style={{ ...style, color: "inherit" }}
    >
      <ReactMarkdown
        children={preprocessMarkdown(content)}
        components={{
          h1: (props) => (
            <h1
              className="text-2xl font-bold mt-3 mb-2 text-foreground"
              {...props}
            />
          ),
          h2: (props) => (
            <h2
              className="text-xl font-bold mt-3 mb-2 text-foreground"
              {...props}
            />
          ),
          h3: (props) => (
            <h3
              className="text-lg font-semibold mt-2 mb-1 text-foreground"
              {...props}
            />
          ),
          h4: (props) => (
            <h4
              className="text-base font-semibold mt-2 mb-1 text-foreground"
              {...props}
            />
          ),
          h5: (props) => (
            <h5
              className="text-sm font-medium mt-2 mb-1 text-foreground"
              {...props}
            />
          ),
          h6: (props) => (
            <h6
              className="text-xs font-medium mt-1 mb-1 text-foreground/90"
              {...props}
            />
          ),
          ul: (props) => (
            <ul className="text-sm list-disc pl-6 space-y-1 my-2" {...props} />
          ),
          ol: (props) => (
            <ol
              className="text-sm list-decimal pl-6 space-y-1 my-2"
              {...props}
            />
          ),
          li: (props) => (
            <li className="text-sm pl-1 my-0.5 text-foreground/80" {...props} />
          ),
          p: (props) => (
            <p
              className="text-sm my-2 text-foreground-dim leading-relaxed"
              {...props}
            />
          ),
          strong: (props) => (
            <strong className="font-semibold text-foreground/90" {...props} />
          ),
          em: (props) => (
            <em className="italic text-foreground/80" {...props} />
          ),
          blockquote: (props) => (
            <blockquote
              className="border-l-4 border-foreground/20 pl-4 italic text-foreground/70 my-2"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className?.includes("language-");
            if (isInline) {
              return (
                <code
                  className="bg-foreground/10 px-1 py-0.5 rounded text-sm font-mono text-foreground/90"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-foreground/10 p-2 rounded-md overflow-x-auto my-2 max-w-full">
                <code
                  className="text-sm font-mono text-foreground/90"
                  {...props}
                >
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
          hr: (props) => (
            <hr className="border-foreground/20 my-4" {...props} />
          ),
          table: (props) => (
            <div className="overflow-x-auto my-2">
              <table
                className="min-w-full border-collapse border border-foreground/20"
                {...props}
              />
            </div>
          ),
          th: (props) => (
            <th
              className="border border-foreground/20 px-2 py-1 bg-foreground/5 font-semibold text-sm text-foreground/90"
              {...props}
            />
          ),
          td: (props) => (
            <td
              className="border border-foreground/20 px-2 py-1 text-sm text-foreground/80"
              {...props}
            />
          ),
        }}
      />
    </div>
  );
};

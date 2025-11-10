import React from 'react';
import { convertUrlsToMarkdown } from './markdownUtils';

// Export a hook for common markdown processing
export const useMarkdownPreprocessing = () => {
  const processContent = React.useCallback(
    (content: string, options?: { convertUrls?: boolean }) => {
      let processed = content;
      
      if (options?.convertUrls) {
        processed = convertUrlsToMarkdown(processed);
      }
      
      return processed;
    },
    []
  );
  
  return { processContent };
};
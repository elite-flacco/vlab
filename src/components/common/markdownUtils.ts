// Utility function to detect and convert URLs to markdown links
export const convertUrlsToMarkdown = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, "[$1]($1)");
};

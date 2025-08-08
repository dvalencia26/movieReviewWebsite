/**
 * Utility functions for text processing and formatting
 */

/**
 * Decodes HTML entities in text
 * @param {string} text - Text containing HTML entities
 * @returns {string} - Decoded text
 */
export const decodeHtmlEntities = (text) => {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * Truncates text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 200) => {
  if (!text) return '';
  const decodedText = decodeHtmlEntities(text);
  return decodedText.length > maxLength 
    ? decodedText.slice(0, maxLength) + '...' 
    : decodedText;
};

/**
 * Counts words in text
 * @param {string} text - Text to count words in
 * @returns {number} - Word count
 */
export const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Estimates reading time based on average reading speed
 * @param {string} text - Text to estimate reading time for
 * @param {number} wordsPerMinute - Average words per minute (default: 200)
 * @returns {number} - Estimated reading time in minutes
 */
export const getReadTime = (text, wordsPerMinute = 200) => {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Formats text content by preserving line breaks and decoding HTML entities
 * Returns the processed text as an array of strings (paragraphs)
 * @param {string} content - Content to format
 * @returns {string[]} - Array of paragraph strings
 */
export const formatTextContent = (content) => {
  if (!content) return [];
  const decodedContent = decodeHtmlEntities(content);
  return decodedContent.split('\n');
};

// CommonJS exports for Jest compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    decodeHtmlEntities,
    truncateText,
    getWordCount,
    getReadTime,
    formatTextContent
  };
}
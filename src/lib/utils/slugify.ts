// src/lib/utils/slugify.ts

/**
 * Converts a string into a URL-safe slug.
 * @param text The input string to slugify.
 * @returns A URL-friendly slug with hyphens.
 */
export const slugify = (text: string): string => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

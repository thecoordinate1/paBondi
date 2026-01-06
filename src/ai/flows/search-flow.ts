'use server';
/**
 * @fileOverview A search AI agent that processes natural language queries.
 *
 * - aiSearch - A function that handles natural language search queries.
 * - AiSearchInput - The input type for the aiSearch function.
 * - AiSearchOutput - The return type for the aiSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AiSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query from the user.'),
});
export type AiSearchInput = z.infer<typeof AiSearchInputSchema>;

export const AiSearchOutputSchema = z.object({
    searchTerm: z.string().describe('The primary keyword or phrase to search for. This should be a corrected or cleaned-up version of the user\'s query.'),
    category: z.string().optional().describe('The specific product or store category mentioned. e.g., "Electronics", "Bakery", "Apparel".'),
    sortBy: z.enum(['relevance', 'price-asc', 'price-desc', 'name-asc', 'name-desc']).optional().describe('The desired sorting order. "price-asc" for cheapest, "price-desc" for most expensive.'),
});
export type AiSearchOutput = z.infer<typeof AiSearchOutputSchema>;

export async function aiSearch(input: AiSearchInput): Promise<AiSearchOutput> {
  return searchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchPrompt',
  input: {schema: AiSearchInputSchema},
  output: {schema: AiSearchOutputSchema},
  prompt: `You are an intelligent search assistant for an e-commerce marketplace. Analyze the user's query. Your primary goal is to correct any misspellings and identify the core search term. Also extract a relevant category if mentioned, and determine the desired sorting order.

Examples:
- "show me cheep shoos" -> searchTerm: "shoes", sortBy: "price-asc"
- "where can i find fresh bred?" -> searchTerm: "bread", category: "Bakery"
- "i want to see t-shirts" -> searchTerm: "t-shirts", category: "Apparel"
- "laptops from most expensive" -> searchTerm: "laptops", category: "Electronics", sortBy: "price-desc"

User Query: """{{query}}"""`,
});

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: AiSearchInputSchema,
    outputSchema: AiSearchOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

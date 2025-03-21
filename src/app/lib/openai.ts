import OpenAI from 'openai';
import { OpenAIPersonaResponse } from '../types/api';
import { PersonaGenerationContext } from '../types/persona';

/**
 * Client for interacting with OpenAI API
 */
export class OpenAIClient {
    private client: OpenAI | null = null;
    private apiKey: string | undefined;

    constructor(apiKey?: string) {
        // Store the API key but don't initialize the client yet
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    }

    // Initialize the client only when needed
    private initializeClient() {
        if (!this.client) {
            if (!this.apiKey) {
                throw new Error('OpenAI API key is required');
            }

            this.client = new OpenAI({
                apiKey: this.apiKey,
            });
        }

        return this.client;
    }

    /**
     * Generate a structured persona based on X profile data
     * @param context X profile data to use as context
     * @returns Generated persona
     */
    async generatePersona(context: PersonaGenerationContext): Promise<OpenAIPersonaResponse> {
        try {
            // Initialize client when method is called
            const client = this.initializeClient();

            // Extract key information from context
            const { recentTweets, bio } = context;

            // Create prompt for OpenAI
            const systemPrompt = `
        You are an expert at understanding people based on their social media presence.
        Your task is to create a detailed persona based on someone's X (formerly Twitter) posts and bio.
        Analyze the content, style, interests, and values expressed in their posts to build this persona.
        
        Return a JSON object with the following structure:
        {
          "name": "Their name (if available, otherwise 'Unknown User')",
          "handle": "Their X handle (without the @ symbol)",
          "bio": "A concise 1-2 sentence description of who they are",
          "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
          "interests": ["interest1", "interest2", "interest3", "interest4", "interest5"]
        }
        
        The traits should represent personality characteristics, communication style, and values.
        The interests should be specific topics, activities, or areas they seem interested in.
        Be specific and precise in your analysis. Base your assessment purely on the provided data.
      `;

            // Create a bullet point list of tweets for the prompt
            const tweetList = recentTweets
                .slice(0, 10) // Limit to 10 tweets to control token usage
                .map(tweet => `• ${tweet}`)
                .join('\n');

            // Build the user message with context
            const userMessage = `
        Here's information from an X (Twitter) user's profile:
        
        ${bio ? `Bio: ${bio}\n\n` : ''}
        
        Recent posts:
        ${tweetList}
        
        Based on this information, create a persona for this user.
      `;

            // Call OpenAI API
            const response = await client.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            });

            // Parse response from OpenAI
            const content = response.choices[0]?.message?.content;

            if (!content) {
                throw new Error('Failed to generate persona: Empty response from OpenAI');
            }

            // Parse the JSON response
            const personaData = JSON.parse(content) as OpenAIPersonaResponse;

            // Validate response structure
            if (!personaData.name || !personaData.traits || !personaData.interests) {
                throw new Error('Failed to generate persona: Invalid response format');
            }

            return personaData;
        } catch (error) {
            console.error('Error generating persona:', error);
            throw new Error('Failed to generate persona');
        }
    }
}

// Export a factory function for creating instances
export const createOpenAIClient = (apiKey?: string) => new OpenAIClient(apiKey);

// Lazy-loaded singleton instance - only created when used
let clientInstance: OpenAIClient | null = null;
export const openaiClient = () => {
    if (!clientInstance) {
        clientInstance = new OpenAIClient();
    }
    return clientInstance;
};
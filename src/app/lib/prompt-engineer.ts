import { PersonaGenerationContext } from '../types/persona';

/**
 * Utility for constructing and optimizing prompts for AI models
 */
export class PromptEngineer {
    /**
     * Create a system prompt for persona generation
     * @returns Engineered system prompt
     */
    static createPersonaSystemPrompt(): string {
        return `
      You are an expert at understanding people based on their social media presence.
      Your task is to create a detailed persona based on someone's X (formerly Twitter) posts and bio.
      Analyze the content, style, interests, and values expressed in their posts to build this persona.
      
      Focus on identifying:
      1. Personality traits (e.g., analytical, creative, empathetic)
      2. Communication style (e.g., direct, humorous, formal)
      3. Values and beliefs (e.g., values authenticity, environmental consciousness)
      4. Interests and activities (e.g., technology, cooking, hiking)
      5. Lifestyle indicators (e.g., urban professional, outdoor enthusiast)
      
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
      
      If there isn't enough information to determine specific traits or interests, make educated guesses
      based on the limited information available, but keep them reasonable and grounded.
    `;
    }

    /**
     * Create a user prompt for persona generation based on context
     * @param context X profile data to use as context
     * @returns Engineered user prompt
     */
    static createPersonaUserPrompt(context: PersonaGenerationContext): string {
        const { recentTweets, bio, profileDescription } = context;

        // Create a bullet point list of tweets for the prompt
        const tweetList = recentTweets
            .slice(0, 10) // Limit to 10 tweets to control token usage
            .map(tweet => `• ${tweet}`)
            .join('\n');

        return `
      Here's information from an X (Twitter) user's profile:
      
      ${bio ? `Bio: ${bio}\n\n` : ''}
      ${profileDescription ? `Profile description: ${profileDescription}\n\n` : ''}
      
      Recent posts:
      ${tweetList}
      
      Based on this information, create a persona for this user following the format in your instructions.
      Focus especially on traits and interests that might influence what locations they would enjoy visiting.
    `;
    }

    /**
     * Create a system prompt for location recommendation context
     * @returns Engineered system prompt for location context
     */
    static createLocationContextSystemPrompt(): string {
        return `
      You are an expert at understanding how personality traits and interests correlate with location preferences.
      Your task is to analyze a user's persona and suggest what types of locations they might enjoy.
      
      For each trait and interest, provide:
      1. What specific aspects of a location would appeal to someone with this trait/interest
      2. What categories of places they might enjoy (e.g., cafes, museums, outdoor spaces)
      3. What specific location attributes would be important (e.g., quiet, social, authentic)
      
      Return a JSON object with the following structure:
      {
        "locationPreferences": [
          {
            "trait": "trait name",
            "placeTypes": ["cafe", "park", "museum"],
            "keyAttributes": ["quiet", "authentic", "creative"]
          }
        ]
      }
    `;
    }

    /**
     * Optimize a prompt to reduce token usage
     * @param prompt The prompt to optimize
     * @returns Optimized prompt with reduced whitespace and unnecessary text
     */
    static optimizePrompt(prompt: string): string {
        return prompt
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\s+([.,;:!?])/g, '$1');
    }
}

// Export the class directly
export default PromptEngineer;
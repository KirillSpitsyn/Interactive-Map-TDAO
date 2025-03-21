import axios from 'axios';
import { ExaSearchResult, ExaChunk } from '../types/api';

/**
 * Client for interacting with the Exa API
 */
export class ExaClient {
    private readonly apiKey: string | undefined;
    private readonly baseUrl: string = 'https://api.exa.ai/search';

    constructor(apiKey?: string) {
        // Store API key but don't validate at construction time
        this.apiKey = apiKey || process.env.EXA_API_KEY;
    }

    /**
     * Validate that the API key is available
     */
    private validateApiKey() {
        if (!this.apiKey) {
            throw new Error('Exa API key is required');
        }
    }

    /**
     * Search for content related to an X handle
     * @param xHandle The X (Twitter) handle to search for
     * @returns Search results from Exa
     */
    async searchXProfile(xHandle: string): Promise<ExaSearchResult> {
        try {
            // Validate API key when method is called
            this.validateApiKey();

            // Clean handle (remove @ if present)
            const cleanHandle = xHandle.replace(/^@/, '');

            // Construct search query - look for recent content from this user
            const query = `site:twitter.com @${cleanHandle} OR from:${cleanHandle}`;

            // Make request to Exa API
            const response = await axios.post(
                this.baseUrl,
                {
                    query,
                    num_results: 10,
                    use_autoprompt: true,
                    include_domains: ['twitter.com', 'x.com'],
                    highlights: true,
                    text_search_strategy: 'keyword',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey,
                    },
                }
            );

            return response.data as ExaSearchResult;
        } catch (error) {
            console.error('Error searching X profile:', error);
            throw new Error('Failed to search X profile');
        }
    }

    /**
     * Extract relevant information from Exa search results
     * @param searchResult The search results from Exa
     * @returns Extracted profile information
     */
    extractProfileInfo(searchResult: ExaSearchResult): {
        tweets: string[];
        bio?: string;
        profileImageUrl?: string;
        name?: string;
    } {
        // Initialize data structure
        const profileInfo = {
            tweets: [] as string[],
            bio: undefined as string | undefined,
            profileImageUrl: undefined as string | undefined,
            name: undefined as string | undefined,
        };

        // Process each chunk
        searchResult.chunks.forEach((chunk: ExaChunk) => {
            // Extract tweets from text
            if (chunk.text && chunk.text.trim()) {
                profileInfo.tweets.push(chunk.text.trim());
            }

            // Try to extract profile image
            if (!profileInfo.profileImageUrl && chunk.extra_info?.image_url) {
                profileInfo.profileImageUrl = chunk.extra_info.image_url;
            }

            // Try to extract name from title
            if (!profileInfo.name && chunk.extra_info?.title) {
                // Titles often have format "Name (@handle) / X"
                const titleMatch = chunk.extra_info.title.match(/^([^(]+)/);
                if (titleMatch && titleMatch[1]) {
                    profileInfo.name = titleMatch[1].trim();
                }
            }

            // Extract bio from profile page
            if (!profileInfo.bio && chunk.url.includes('/status/') === false) {
                // Bio might be in the text of their profile page
                const bioLines = chunk.text
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line =>
                        line.length > 10 &&
                        !line.includes('Followers') &&
                        !line.includes('Following') &&
                        !line.includes('Posts') &&
                        !line.startsWith('@')
                    );

                if (bioLines.length > 0) {
                    profileInfo.bio = bioLines[0];
                }
            }
        });

        return profileInfo;
    }
}

// Export a factory function for testing or custom instances
export const createExaClient = (apiKey?: string) => new ExaClient(apiKey);

// Lazy-loaded singleton instance - only created when used
let clientInstance: ExaClient | null = null;
export const exaClient = () => {
    if (!clientInstance) {
        clientInstance = new ExaClient();
    }
    return clientInstance;
};
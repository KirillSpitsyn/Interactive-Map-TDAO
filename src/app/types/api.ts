
/**
 * API Request and Response Types
 */

// Persona API
export interface GeneratePersonaRequest {
    xHandle: string;
}

export interface GeneratePersonaResponse {
    success: boolean;
    persona?: {
        name: string;
        handle: string;
        bio: string;
        traits: string[];
        interests: string[];
        profileImageUrl?: string;
    };
    error?: string;
}

// Locations API
export interface GenerateLocationsRequest {
    persona: {
        name: string;
        handle: string;
        bio: string;
        traits: string[];
        interests: string[];
    };
    location: string;
}

export interface GenerateLocationsResponse {
    success: boolean;
    locations?: Array<{
        id: string;
        name: string;
        address: string;
        description: string;
        category: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        rating?: number;
    }>;
    error?: string;
}

// Exa API Response Types
export interface ExaSearchResult {
    chunks: ExaChunk[];
    extra_info: {
        total_chunk_count: number;
    };
}

export interface ExaChunk {
    text: string;
    url: string;
    extra_info?: {
        title?: string;
        author?: string;
        publish_date?: string;
        image_url?: string;
    };
}

// OpenAI API Types
export interface OpenAIPersonaResponse {
    name: string;
    handle: string;
    bio: string;
    traits: string[];
    interests: string[];
}
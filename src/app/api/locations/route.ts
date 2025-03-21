import { NextRequest, NextResponse } from 'next/server';
import { googleMapsClient } from '@/app/lib/google-maps';
import { GenerateLocationsRequest, GenerateLocationsResponse } from '@/app/types/api';

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body: GenerateLocationsRequest = await request.json();
        const { persona, location } = body;

        // Validate input
        if (!persona || !location) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request. Please provide both persona and location.',
                },
                { status: 400 }
            );
        }

        // Find recommended locations
        const recommendedLocations = await googleMapsClient().findRecommendedLocations(
            persona,
            location
        );

        // Handle case where no locations were found
        if (recommendedLocations.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No suitable locations found. Please try a different location or X profile.',
                },
                { status: 404 }
            );
        }

        // Construct the response
        const response: GenerateLocationsResponse = {
            success: true,
            locations: recommendedLocations,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error generating locations:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to find recommended locations. Please try again later.',
            },
            { status: 500 }
        );
    }
}
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location } from './LocationList';

interface LocationMapProps {
    locations: Location[];
    selectedLocationId: string | null;
    onLocationSelect: (locationId: string) => void;
    profileImage?: string;
    centerCoordinates?: { lat: number; lng: number };
}

const LocationMap: React.FC<LocationMapProps> = ({
                                                     locations,
                                                     selectedLocationId,
                                                     onLocationSelect,
                                                     profileImage,
                                                     centerCoordinates,
                                                 }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>({ lat: 43.6532, lng: -79.3832 }); // Toronto coordinates
    const [radius, setRadius] = useState<number>(30); // Default 10km radius
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);

    // Calculate center coordinates from locations if not provided
    useEffect(() => {
        if (locations.length > 0 && !centerCoordinates && !mapCenter) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach((location) => {
                bounds.extend(location.coordinates);
            });

            const center = {
                lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
                lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
            };

            setMapCenter(center);
        } else if (centerCoordinates) {
            setMapCenter(centerCoordinates);
        }
        // If no locations or centerCoordinates, mapCenter remains as Toronto
    }, [locations, centerCoordinates, mapCenter]);

    const onLoad = useCallback((map: google.maps.Map) => {
        // Create a circle for Toronto with 10km radius
        const torontoCircle = new google.maps.Circle({
            strokeColor: '#2563EB',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            map,
            center: { lat: 43.6532, lng: -79.3832 }, // Toronto
            radius: 10000, // 10km in meters
        });
        setCircle(torontoCircle);

        // Fit map to show all markers or default to Toronto area
        if (locations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach((location) => {
                bounds.extend(location.coordinates);
            });
            map.fitBounds(bounds);
        } else {
            map.setCenter({ lat: 43.6532, lng: -79.3832 });
            map.setZoom(12);
        }

        // Enable tilt (3D effect) and set heading for 3D view
        map.setTilt(45); // Adjust tilt angle for 3D view
        map.setHeading(45); // Rotate the map for better 3D effect (optional)
        map.setMapTypeId(google.maps.MapTypeId.SATELLITE); // Set satellite view
    }, [locations]);

    const onUnmount = useCallback(() => {
        setMap(null);
        if (circle) {
            circle.setMap(null);
            setCircle(null);
        }
    }, [circle]);

    // Remove the user location and radius change functions
    const handleMarkerClick = (locationId: string) => {
        onLocationSelect(locationId);

        // Center map on the selected location
        const selectedLocation = locations.find(loc => loc.id === locationId);
        if (selectedLocation && map) {
            map.panTo(selectedLocation.coordinates);
            map.setZoom(15); // Zoom in a bit
        }
    };

    const getCategoryIcon = (category: string, selected: boolean): google.maps.Icon | google.maps.Symbol => {
        // Use profile image for marker if available
        if (profileImage) {
            return {
                url: profileImage,
                scaledSize: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(20, 20),
            };
        }

        // Default color-coded markers by category
        const colors: Record<string, string> = {
            restaurant: 'FF5252',
            cafe: 'FFAB40',
            bar: '7C4DFF',
            park: '66BB6A',
            museum: 'FFC107',
            shopping: 'EC407A',
            entertainment: '448AFF',
            sports: '26A69A',
            fitness: 'EF5350',
            education: '5C6BC0',
            work: '78909C',
            tech: '42A5F5',
            art: 'AB47BC',
            music: '26C6DA',
            outdoor: '9CCC65',
            default: '757575'
        };

        const color = colors[category.toLowerCase()] || colors.default;
        const size = selected ? 36 : 28;

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: `#${color}`,
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: size / 10, // Adjust scale to desired size
        };
    };

    if (!isLoaded || !mapCenter) {
        return (
            <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
                <p className="text-gray-500">Loading map...</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg overflow-hidden shadow-md">
            <div className="h-[450px]">
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter || { lat: 43.6532, lng: -79.3832 }} // Default to Toronto
                    zoom={12}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        fullscreenControl: true,
                        mapTypeControl: false,
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }]
                            }
                        ]
                    }}
                >
                    {locations.map((location) => (
                        <Marker
                            key={location.id}
                            position={location.coordinates}
                            onClick={() => handleMarkerClick(location.id)}
                            icon={getCategoryIcon(location.category, selectedLocationId === location.id)}
                            animation={selectedLocationId === location.id ? google.maps.Animation.BOUNCE : undefined}
                        >
                            {selectedLocationId === location.id && (
                                <InfoWindow onCloseClick={() => onLocationSelect('')}>
                                    <div className="p-2 max-w-xs">
                                        <h3 className="font-medium text-sm">{location.name}</h3>
                                        <p className="text-xs text-gray-600">{location.address}</p>
                                    </div>
                                </InfoWindow>
                            )}
                        </Marker>
                    ))}
                </GoogleMap>
            </div>
        </div>
    );
};

export default LocationMap;
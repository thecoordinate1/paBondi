"use client";

import React, { useState, useEffect } from 'react';
import { Map, Marker } from 'pigeon-maps';

interface CheckoutMapProps {
    location: string;
    onLocationChange: (lat: number, lng: number) => void;
}

export default function CheckoutMap({ location, onLocationChange }: CheckoutMapProps) {
    // Default to Lusaka, Zambia if no location is provided
    const DEFAULT_CENTER: [number, number] = [-15.4167, 28.2833];

    const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const [zoom, setZoom] = useState(13);
    const [markerLocation, setMarkerLocation] = useState<[number, number] | undefined>(undefined);

    useEffect(() => {
        if (location) {
            const parts = location.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const newLocation: [number, number] = [parts[0], parts[1]];
                setCenter(newLocation);
                setMarkerLocation(newLocation);
            }
        }
    }, [location]);

    const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
        setMarkerLocation(latLng);
        onLocationChange(latLng[0], latLng[1]);
    };

    return (
        <div className="h-[300px] w-full rounded-md overflow-hidden border mt-2">
            <Map
                height={300}
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
                onClick={handleMapClick}
            >
                {markerLocation && <Marker width={40} anchor={markerLocation} />}
            </Map>
            <p className="text-xs text-muted-foreground mt-1 text-center">
                Click on the map to set your delivery location.
            </p>
        </div>
    );
}

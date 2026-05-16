import React, { useEffect, useState, useRef, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  type?: 'order' | 'driver' | 'customer' | 'sos';
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  height?: string;
}

function MarkerWithRef({ marker, onMarkerCreated, onMarkerDestroyed }: { 
  marker: MapMarker, 
  onMarkerCreated: (id: string, element: google.maps.marker.AdvancedMarkerElement) => void,
  onMarkerDestroyed: (id: string) => void,
  key?: React.Key
}) {
  return (
    <AdvancedMarker 
      position={marker.position}
      ref={(instance) => {
        if (instance) {
          onMarkerCreated(marker.id, instance);
        } else {
          onMarkerDestroyed(marker.id);
        }
      }}
    >
      <Pin 
        background={
          marker.type === 'sos' ? '#ef4444' : 
          marker.type === 'driver' ? '#9333ea' : 
          marker.type === 'customer' ? '#f43f5e' :
          '#3b82f6'
        } 
        glyphColor="#fff" 
        borderColor="#fff"
        scale={marker.type === 'driver' ? 1.2 : 1}
      />
    </AdvancedMarker>
  );
}

function Clusterer({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const clusterer = useRef<MarkerClusterer | null>(null);
  const markerElements = useRef<{[key: string]: google.maps.marker.AdvancedMarkerElement}>({});

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  const handleMarkerCreated = (id: string, element: google.maps.marker.AdvancedMarkerElement) => {
    if (markerElements.current[id]) return;
    markerElements.current[id] = element;
    clusterer.current?.addMarker(element);
  };

  const handleMarkerDestroyed = (id: string) => {
    const element = markerElements.current[id];
    if (element) {
      clusterer.current?.removeMarker(element);
      delete markerElements.current[id];
    }
  };

  // Keep clusterer in sync with map
  useEffect(() => {
    if (clusterer.current && map) {
      clusterer.current.setMap(map);
    }
    return () => {
      clusterer.current?.setMap(null);
    };
  }, [map]);

  return (
    <>
      {markers.map((marker) => (
        <MarkerWithRef 
          key={marker.id} 
          marker={marker} 
          onMarkerCreated={handleMarkerCreated}
          onMarkerDestroyed={handleMarkerDestroyed}
        />
      ))}
    </>
  );
}

export default function MapView({ 
  center, 
  zoom = 12, 
  markers = [], 
  onMapClick,
  height = '100%'
}: MapViewProps) {
  const isIndia = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Calcutta';
  const defaultCenter = isIndia ? { lat: 20.5937, lng: 78.9629 } : { lat: 37.42, lng: -122.08 };
  const actualCenter = center || defaultCenter;
  const actualZoom = center ? zoom : (isIndia ? 4 : zoom);


  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    return (
      <div className="flex items-center justify-center bg-gray-900 text-white p-8 rounded-2xl border border-gold-800/30 h-[500px] md:h-full min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold-500/50">
            <span className="text-gold-500 font-bold text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold mb-4 text-gold-400">Map Configuration Required</h2>
          <p className="text-sm text-gray-400 mb-6">
            To view the refueling network, please add your Google Maps API key as a secret.
          </p>
          <div className="text-left space-y-3 bg-black/40 p-5 rounded-xl border border-gray-800">
            <p className="text-xs font-bold text-gold-500 uppercase tracking-widest">Setup Guide:</p>
            <ol className="text-xs text-gray-400 list-decimal pl-4 space-y-2">
              <li>Get an API key from Google Cloud Console</li>
              <li>Open Settings (⚙️) → Secrets</li>
              <li>Add <code className="text-gold-400">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div style={{ width: '100%', height, minHeight: '400px' }} className="rounded-2xl overflow-hidden border border-gold-800/30 shadow-2xl shadow-gold-950/20 bg-gray-900">
        <Map
          defaultCenter={actualCenter}
          defaultZoom={actualZoom}
          mapId="FUGO_FUEL_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={onMapClick}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={[
            {
              "elementType": "geometry",
              "stylers": [{ "color": "#212121" }]
            },
            {
              "elementType": "labels.icon",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#757575" }]
            },
            {
              "elementType": "labels.text.stroke",
              "stylers": [{ "color": "#212121" }]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{ "color": "#757575" }]
            },
            {
              "featureType": "administrative.country",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#9e9e9e" }]
            },
            {
              "featureType": "administrative.land_parcel",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#bdbdbd" }]
            },
            {
              "featureType": "poi",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#757575" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry.fill",
              "stylers": [{ "color": "#2c2c2c" }]
            },
            {
              "featureType": "road",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#8a8a8a" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{ "color": "#3c3c3c" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#616161" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#000000" }]
            }
          ]}
        >
          <Clusterer markers={markers} />
        </Map>
      </div>
    </APIProvider>
  );
}

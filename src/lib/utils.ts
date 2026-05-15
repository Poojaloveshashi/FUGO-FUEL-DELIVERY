import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateETA(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Assume average city speed of 30 km/h
  const speedKmH = 30;
  const timeHours = distance / speedKmH;
  const timeMinutes = Math.round(timeHours * 60);
  
  // Add 2-5 minutes buffer for elite service
  return Math.max(3, timeMinutes + 2);
}

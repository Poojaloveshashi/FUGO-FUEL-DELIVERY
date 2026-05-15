/**
 * Audio Asset Manifest for Elite Operations
 */
const NOTIFICATION_SOUNDS = {
  DRIVER: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Intense emergency beep
  SUPPORT: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Digital ping
  ORDER: 'https://assets.mixkit.co/active_storage/sfx/1364/1364-preview.mp3', // Soft success chime
};

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function triggerSOSNotification(role: 'driver' | 'support' | string, address: string) {
  // 1. Trigger Audio
  const soundUrl = role === 'driver' ? NOTIFICATION_SOUNDS.DRIVER : NOTIFICATION_SOUNDS.SUPPORT;
  const audio = new Audio(soundUrl);
  audio.play().catch(e => console.warn('Audio playback blocked:', e));

  // 2. Trigger Push Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🚨 EMERGENCY: PRIORITY ZERO', {
      body: `SOS SIGNAL DETECTED: ${address}. Respond immediately.`,
      icon: '/fuel_icon.png', // Fallback to a generic icon if app doesn't have one
      tag: 'sos-alert',
      requireInteraction: true,
    });
  }
}

export function triggerNewOrderNotification() {
  const audio = new Audio(NOTIFICATION_SOUNDS.ORDER);
  audio.play().catch(e => console.warn('Audio playback blocked:', e));

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ELITE TASK FOUND', {
      body: 'A new high-priority refueling task is available in your sector.',
      icon: '/fuel_icon.png',
      tag: 'new-order',
    });
  }
}

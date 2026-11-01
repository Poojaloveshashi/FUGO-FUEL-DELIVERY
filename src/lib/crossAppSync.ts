import { Order, OrderStatus } from '../types';

/**
 * Connected Customer Ordering App details
 * Link: https://ai.studio/apps/ee2e6063-3db0-4d3c-b767-c5c103cedc79
 */
export const CONNECTED_CUSTOMER_APPLET_ID = 'ee2e6063-3db0-4d3c-b767-c5c103cedc79';
export const CONNECTED_CUSTOMER_APPLET_URL = `https://ai.studio/apps/${CONNECTED_CUSTOMER_APPLET_ID}`;
export const CURRENT_DRIVER_APPLET_ID = '4d28260b-2153-449e-8927-36441be4e78c';

const BROADCAST_CHANNEL_NAME = 'fugo_cross_app_orders_sync';

export interface CrossAppMessage {
  type: 'NEW_ORDER' | 'ORDER_ACCEPTED' | 'LOCATION_PING' | 'ORDER_COMPLETED' | 'HEARTBEAT';
  senderAppId: string;
  order: Order;
  timestamp: string;
}

let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[CrossAppSync] BroadcastChannel init notice:', e);
}

/**
 * Broadcasts order lifecycle event to connected browser tabs / apps
 */
export function broadcastCrossAppOrder(
  type: CrossAppMessage['type'],
  order: Order
) {
  const message: CrossAppMessage = {
    type,
    senderAppId: CURRENT_DRIVER_APPLET_ID,
    order: {
      ...order,
      source_app: order.source_app || CONNECTED_CUSTOMER_APPLET_ID,
      sourceAppUrl: CONNECTED_CUSTOMER_APPLET_URL,
    },
    timestamp: new Date().toISOString(),
  };

  // 1. BroadcastChannel across tabs
  try {
    broadcastChannel?.postMessage(message);
  } catch (err) {
    console.warn('[CrossAppSync] BroadcastChannel send error:', err);
  }

  // 2. window.parent postMessage if embedded in iframe
  try {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ fugoDelivery: true, ...message }, '*');
    }
  } catch (err) {
    console.warn('[CrossAppSync] postMessage error:', err);
  }
}

/**
 * Listens for cross-app order messages from other tabs or iframes
 */
export function subscribeToCrossAppSync(
  onIncomingOrder: (order: Order) => void,
  onOrderUpdated: (order: Order) => void
): () => void {
  const handleMessage = (data: any) => {
    if (!data || !data.order) return;
    const { type, order, senderAppId } = data as CrossAppMessage;

    // Normalize source app tagging
    const normalizedOrder: Order = {
      ...order,
      source_app: order.source_app || senderAppId || CONNECTED_CUSTOMER_APPLET_ID,
      sourceAppUrl: CONNECTED_CUSTOMER_APPLET_URL,
    };

    if (type === 'NEW_ORDER' && order.status === OrderStatus.PENDING) {
      onIncomingOrder(normalizedOrder);
    } else {
      onOrderUpdated(normalizedOrder);
    }
  };

  const channelListener = (event: MessageEvent) => {
    handleMessage(event.data);
  };

  const windowListener = (event: MessageEvent) => {
    if (event.data?.fugoDelivery) {
      handleMessage(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', channelListener);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('message', windowListener);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', channelListener);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', windowListener);
    }
  };
}

/**
 * Checks if current browser URL contains deep-linked order parameters
 */
export function getInitialDeepLinkedOrder(): { orderId?: string; sourceApp?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id') || params.get('orderId') || undefined;
    const sourceApp = params.get('source_app') || params.get('sourceApp') || undefined;
    return { orderId, sourceApp };
  } catch {
    return {};
  }
}

/**
 * Returns prompt to connect customer app (ee2e6063-3db0-4d3c-b767-c5c103cedc79)
 */
export function getCustomerAppSyncPrompt(): string {
  return `Connect this app to our live Supabase database. Use @supabase/supabase-js.
Supabase URL: https://arierwpjaksxxnmvbqwn.supabase.co
Supabase Anon Key: [PASTE_YOUR_SUPABASE_ANON_KEY_HERE]
When an order is placed, insert it into the 'orders' table with:
- status: 'PENDING'
- service_type: 'FUEL' (or 'TRANSPORT')
- 4-digit OTP: random 1000-9999
- source_app: 'ee2e6063-3db0-4d3c-b767-c5c103cedc79'
And subscribe in real-time to changes on that order so driver acceptance ('IN_TRANSIT'), GPS coordinates ('driver_lat', 'driver_lng'), and completion ('COMPLETED') sync live.`;
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  heliusWebhookService,
  WebhookResponse,
  CreateWebhookRequest,
  WebhookEvent,
  LeagueWebhookEvent,
  WebhookEventProcessor,
  TransactionType,
} from '../lib/helius/webhooks';

// Hook for managing webhooks
export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const webhookList = await heliusWebhookService.getWebhooks();
      setWebhooks(webhookList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (config: CreateWebhookRequest): Promise<WebhookResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const webhook = await heliusWebhookService.createWebhook(config);
      setWebhooks(prev => [...prev, webhook]);
      return webhook;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWebhook = useCallback(async (
    webhookId: string, 
    config: Partial<CreateWebhookRequest>
  ): Promise<WebhookResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedWebhook = await heliusWebhookService.updateWebhook(webhookId, config);
      setWebhooks(prev => prev.map(w => w.webhookID === webhookId ? updatedWebhook : w));
      return updatedWebhook;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWebhook = useCallback(async (webhookId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await heliusWebhookService.deleteWebhook(webhookId);
      setWebhooks(prev => prev.filter(w => w.webhookID !== webhookId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  };
}

// Hook for league-specific webhooks
export function useLeagueWebhooks(leagueAddress?: string) {
  const { webhooks, createWebhook, deleteWebhook, loading, error } = useWebhooks();
  const [leagueWebhooks, setLeagueWebhooks] = useState<WebhookResponse[]>([]);

  useEffect(() => {
    if (leagueAddress) {
      const filtered = webhooks.filter(webhook => 
        webhook.accountAddresses.includes(leagueAddress)
      );
      setLeagueWebhooks(filtered);
    }
  }, [webhooks, leagueAddress]);

  const createLeagueWebhook = useCallback(async (
    webhookUrl: string,
    authHeader?: string
  ): Promise<WebhookResponse | null> => {
    if (!leagueAddress) {
      throw new Error('League address is required');
    }

    return heliusWebhookService.createLeagueWebhook(leagueAddress, webhookUrl, authHeader);
  }, [leagueAddress]);

  return {
    leagueWebhooks,
    createLeagueWebhook,
    deleteWebhook,
    loading,
    error,
  };
}

// Hook for user-specific webhooks
export function useUserWebhooks() {
  const { publicKey } = useWallet();
  const { webhooks, createWebhook, deleteWebhook, loading, error } = useWebhooks();
  const [userWebhooks, setUserWebhooks] = useState<WebhookResponse[]>([]);

  useEffect(() => {
    if (publicKey) {
      const userAddress = publicKey.toString();
      const filtered = webhooks.filter(webhook => 
        webhook.accountAddresses.includes(userAddress)
      );
      setUserWebhooks(filtered);
    }
  }, [webhooks, publicKey]);

  const createUserWebhook = useCallback(async (
    webhookUrl: string,
    authHeader?: string
  ): Promise<WebhookResponse | null> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    return heliusWebhookService.createUserWebhook(
      publicKey.toString(),
      webhookUrl,
      authHeader
    );
  }, [publicKey]);

  return {
    userWebhooks,
    createUserWebhook,
    deleteWebhook,
    loading,
    error,
  };
}

// Hook for real-time webhook events (using WebSocket or Server-Sent Events)
export function useWebhookEvents(webhookUrl?: string) {
  const [events, setEvents] = useState<LeagueWebhookEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addEvent = useCallback((event: WebhookEvent) => {
    const leagueEvent = WebhookEventProcessor.processLeagueEvent(event);
    setEvents(prev => [leagueEvent, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  const connectToEventStream = useCallback((url: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const webhookEvent: WebhookEvent = JSON.parse(event.data);
          addEvent(webhookEvent);
        } catch (err) {
          console.error('Failed to parse webhook event:', err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        setError('Connection to webhook events failed');
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to event stream');
    }
  }, [addEvent]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const filterEvents = useCallback((types: TransactionType[]) => {
    return WebhookEventProcessor.filterEventsByType(events, types);
  }, [events]);

  const getEventsForAccount = useCallback((accountAddress: string) => {
    return WebhookEventProcessor.getEventsForAccount(events, accountAddress);
  }, [events]);

  useEffect(() => {
    if (webhookUrl) {
      connectToEventStream(webhookUrl);
    }

    return () => {
      disconnect();
    };
  }, [webhookUrl, connectToEventStream, disconnect]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    events,
    connected,
    error,
    addEvent,
    clearEvents,
    filterEvents,
    getEventsForAccount,
    connectToEventStream,
    disconnect,
  };
}

// Hook for webhook analytics
export function useWebhookAnalytics(events: LeagueWebhookEvent[]) {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    eventsByType: {} as Record<string, number>,
    eventsByAction: {} as Record<string, number>,
    totalVolume: 0,
    averageTransactionSize: 0,
    eventsLast24h: 0,
    eventsLast7d: 0,
  });

  useEffect(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const eventsByType: Record<string, number> = {};
    const eventsByAction: Record<string, number> = {};
    let totalVolume = 0;
    let eventsLast24h = 0;
    let eventsLast7d = 0;

    events.forEach(event => {
      const eventTime = event.timestamp * 1000;
      
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by action
      if (event.leagueContext?.action) {
        const action = event.leagueContext.action;
        eventsByAction[action] = (eventsByAction[action] || 0) + 1;
      }
      
      // Calculate volume
      if (event.leagueContext?.amount) {
        totalVolume += event.leagueContext.amount;
      }
      
      // Count recent events
      if (eventTime > oneDayAgo) {
        eventsLast24h++;
      }
      if (eventTime > sevenDaysAgo) {
        eventsLast7d++;
      }
    });

    const averageTransactionSize = events.length > 0 ? totalVolume / events.length : 0;

    setAnalytics({
      totalEvents: events.length,
      eventsByType,
      eventsByAction,
      totalVolume,
      averageTransactionSize,
      eventsLast24h,
      eventsLast7d,
    });
  }, [events]);

  return analytics;
}
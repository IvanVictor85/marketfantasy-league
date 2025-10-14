import React, { useState, useCallback } from 'react';
import { useWebhooks, useWebhookEvents, useWebhookAnalytics } from '../hooks/useWebhooks';
import {
  WebhookResponse,
  CreateWebhookRequest,
  TransactionType,
  LeagueWebhookEvent,
  webhookUtils,
} from '../lib/helius/webhooks';

interface WebhookManagerProps {
  leagueAddress?: string;
  className?: string;
}

export const WebhookManager: React.FC<WebhookManagerProps> = ({
  leagueAddress,
  className = '',
}) => {
  const {
    webhooks,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  } = useWebhooks();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookResponse | null>(null);
  const [eventStreamUrl, setEventStreamUrl] = useState('');

  const {
    events,
    connected,
    error: eventError,
    connectToEventStream,
    disconnect,
    clearEvents,
  } = useWebhookEvents(eventStreamUrl);

  const analytics = useWebhookAnalytics(events);

  const handleCreateWebhook = useCallback(async (config: CreateWebhookRequest) => {
    const webhook = await createWebhook(config);
    if (webhook) {
      setShowCreateForm(false);
    }
  }, [createWebhook]);

  const handleUpdateWebhook = useCallback(async (
    webhookId: string,
    config: Partial<CreateWebhookRequest>
  ) => {
    const webhook = await updateWebhook(webhookId, config);
    if (webhook) {
      setEditingWebhook(null);
    }
  }, [updateWebhook]);

  const handleDeleteWebhook = useCallback(async (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      await deleteWebhook(webhookId);
    }
  }, [deleteWebhook]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading webhooks...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Webhook Manager</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Webhook
        </button>
      </div>

      {/* Error Display */}
      {(error || eventError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || eventError}</p>
        </div>
      )}

      {/* Analytics Dashboard */}
      {events.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Events</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.totalEvents}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Last 24h</p>
              <p className="text-2xl font-bold text-green-900">{analytics.eventsLast24h}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Volume</p>
              <p className="text-2xl font-bold text-purple-900">
                {(analytics.totalVolume / 1e9).toFixed(2)} SOL
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Avg Transaction</p>
              <p className="text-2xl font-bold text-orange-900">
                {(analytics.averageTransactionSize / 1e9).toFixed(4)} SOL
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event Stream Connection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Events</h3>
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="url"
            placeholder="Event stream URL (e.g., /api/webhook-events)"
            value={eventStreamUrl}
            onChange={(e) => setEventStreamUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => connected ? disconnect() : connectToEventStream(eventStreamUrl)}
            disabled={!eventStreamUrl}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              connected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
            }`}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
          {events.length > 0 && (
            <button
              onClick={clearEvents}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Events
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {connected ? 'Connected to event stream' : 'Disconnected'}
          </span>
        </div>

        {/* Recent Events */}
        {events.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-900">Recent Events ({events.length})</h4>
            {events.slice(0, 10).map((event, index) => (
              <EventCard key={`${event.signature}-${index}`} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Webhooks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Webhooks ({webhooks.length})
          </h3>
        </div>
        
        {webhooks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No webhooks configured. Create one to start receiving real-time notifications.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.webhookID}
                webhook={webhook}
                onEdit={setEditingWebhook}
                onDelete={handleDeleteWebhook}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Webhook Modal */}
      {showCreateForm && (
        <WebhookForm
          onSubmit={handleCreateWebhook}
          onCancel={() => setShowCreateForm(false)}
          leagueAddress={leagueAddress}
        />
      )}

      {/* Edit Webhook Modal */}
      {editingWebhook && (
        <WebhookForm
          webhook={editingWebhook}
          onSubmit={(config) => handleUpdateWebhook(editingWebhook.webhookID, config)}
          onCancel={() => setEditingWebhook(null)}
          leagueAddress={leagueAddress}
        />
      )}
    </div>
  );
};

// Webhook Card Component
interface WebhookCardProps {
  webhook: WebhookResponse;
  onEdit: (webhook: WebhookResponse) => void;
  onDelete: (webhookId: string) => void;
}

const WebhookCard: React.FC<WebhookCardProps> = ({ webhook, onEdit, onDelete }) => {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900">Webhook {webhook.webhookID.slice(0, 8)}...</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              webhook.webhookType.includes('enhanced') 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {webhook.webhookType}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            <strong>URL:</strong> {webhook.webhookURL}
          </p>
          
          <p className="text-sm text-gray-600 mb-2">
            <strong>Transaction Types:</strong> {webhook.transactionTypes.join(', ')}
          </p>
          
          <p className="text-sm text-gray-600">
            <strong>Accounts:</strong> {webhook.accountAddresses.length} address(es)
          </p>
          
          {webhook.accountAddresses.length <= 3 && (
            <div className="mt-2 space-y-1">
              {webhook.accountAddresses.map((address, index) => (
                <p key={index} className="text-xs text-gray-500 font-mono">
                  {address}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onEdit(webhook)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(webhook.webhookID)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: LeagueWebhookEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 text-xs rounded-full ${
              event.leagueContext?.action === 'deposit' 
                ? 'bg-green-100 text-green-800'
                : event.leagueContext?.action === 'withdraw'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {event.type}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(event.timestamp * 1000).toLocaleTimeString()}
            </span>
          </div>
          
          <p className="text-sm text-gray-900">
            {webhookUtils.formatEventForDisplay(event)}
          </p>
          
          {event.leagueContext && (
            <p className="text-xs text-gray-600 mt-1">
              Action: {event.leagueContext.action}
              {event.leagueContext.amount && (
                <> • Amount: {(event.leagueContext.amount / 1e9).toFixed(4)} SOL</>
              )}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <a
            href={webhookUtils.getExplorerUrl(event.signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Explorer
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-800 text-xs"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-700">Signature:</p>
              <p className="font-mono text-gray-600 break-all">{event.signature}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Fee:</p>
              <p className="text-gray-600">{(event.fee / 1e9).toFixed(6)} SOL</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Slot:</p>
              <p className="text-gray-600">{event.slot.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Source:</p>
              <p className="text-gray-600">{event.source}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Webhook Form Component
interface WebhookFormProps {
  webhook?: WebhookResponse;
  onSubmit: (config: CreateWebhookRequest) => void;
  onCancel: () => void;
  leagueAddress?: string;
}

const WebhookForm: React.FC<WebhookFormProps> = ({
  webhook,
  onSubmit,
  onCancel,
  leagueAddress,
}) => {
  const [formData, setFormData] = useState<CreateWebhookRequest>({
    webhookURL: webhook?.webhookURL || '',
    transactionTypes: webhook?.transactionTypes || ['Any'],
    accountAddresses: webhook?.accountAddresses || (leagueAddress ? [leagueAddress] : ['']),
    webhookType: webhook?.webhookType as any || 'enhanced',
    authHeader: webhook?.authHeader || '',
  });

  const transactionTypes: TransactionType[] = [
    'Any', 'SWAP', 'NFT_BID', 'NFT_LISTING', 'NFT_PURCHASE', 'NFT_SALE', 'NFT_MINT'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...formData.accountAddresses];
    newAddresses[index] = value;
    setFormData({ ...formData, accountAddresses: newAddresses });
  };

  const addAddress = () => {
    setFormData({
      ...formData,
      accountAddresses: [...formData.accountAddresses, ''],
    });
  };

  const removeAddress = (index: number) => {
    const newAddresses = formData.accountAddresses.filter((_, i) => i !== index);
    setFormData({ ...formData, accountAddresses: newAddresses });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                required
                value={formData.webhookURL}
                onChange={(e) => setFormData({ ...formData, webhookURL: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://your-app.com/webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Type
              </label>
              <select
                value={formData.webhookType}
                onChange={(e) => setFormData({ ...formData, webhookType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="enhanced">Enhanced</option>
                <option value="raw">Raw</option>
                <option value="enhancedDevnet">Enhanced (Devnet)</option>
                <option value="rawDevnet">Raw (Devnet)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Types
              </label>
              <div className="grid grid-cols-3 gap-2">
                {transactionTypes.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.transactionTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            transactionTypes: [...formData.transactionTypes, type],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            transactionTypes: formData.transactionTypes.filter(t => t !== type),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Addresses
              </label>
              {formData.accountAddresses.map((address, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Account address to monitor"
                  />
                  {formData.accountAddresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAddress}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Address
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Header (Optional)
              </label>
              <input
                type="text"
                value={formData.authHeader}
                onChange={(e) => setFormData({ ...formData, authHeader: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bearer token or custom auth header"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {webhook ? 'Update' : 'Create'} Webhook
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WebhookManager;
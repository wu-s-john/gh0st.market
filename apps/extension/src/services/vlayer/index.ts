import { VlayerClient } from './real-client';
import { MockVlayerClient } from './mock-client';
import type { IVlayerClient } from './types';

/**
 * Factory function to create a vlayer client.
 * Automatically selects mock or real implementation based on environment.
 */
export function createVlayerClient(): IVlayerClient {
  const useMock = process.env.PLASMO_PUBLIC_USE_MOCK === 'true';

  if (useMock) {
    console.log('[vlayer] Using mock client');
    return new MockVlayerClient();
  }

  const clientId = process.env.PLASMO_PUBLIC_VLAYER_CLIENT_ID;
  const secret = process.env.PLASMO_PUBLIC_VLAYER_SECRET;

  if (!clientId || !secret) {
    console.warn('[vlayer] Missing credentials, falling back to mock client');
    return new MockVlayerClient();
  }

  console.log('[vlayer] Using real client');
  return new VlayerClient({ clientId, secret });
}

// Re-export types and classes
export type { IVlayerClient, VlayerClientConfig } from './types';
export { VlayerClient } from './real-client';
export { MockVlayerClient } from './mock-client';

import type {
  VlayerProveInput,
  VlayerProveOutput,
  VlayerVerifyOutput,
} from '~schemas';

import type { IVlayerClient } from './types';

/**
 * Mock vlayer client for testing without calling the real API.
 */
export class MockVlayerClient implements IVlayerClient {
  private simulatedDelay: number;

  constructor(simulatedDelay = 1000) {
    this.simulatedDelay = simulatedDelay;
  }

  async prove(input: VlayerProveInput): Promise<VlayerProveOutput> {
    // Simulate network delay
    await this.delay(this.simulatedDelay);

    // Create a mock presentation
    const mockData = {
      url: input.url,
      method: input.method ?? 'GET',
      timestamp: Date.now(),
      mock: true,
    };

    return {
      data: '0x' + this.toHex(JSON.stringify(mockData)),
      version: '1.0.0-mock',
      meta: {
        notaryUrl: 'https://mock-notary.local',
      },
    };
  }

  async verify(presentation: VlayerProveOutput): Promise<VlayerVerifyOutput> {
    // Simulate network delay
    await this.delay(this.simulatedDelay / 2);

    // Decode the mock data to get the original URL
    let mockData: { url: string; mock: boolean } | null = null;
    try {
      const decoded = this.fromHex(presentation.data.slice(2));
      mockData = JSON.parse(decoded);
    } catch {
      // Ignore decode errors
    }

    // Return mock verified response
    return {
      response: {
        status: 200,
        headers: {
          'content-type': 'text/html',
        },
        body: JSON.stringify({
          verified: true,
          mock: true,
          originalUrl: mockData?.url ?? 'unknown',
          timestamp: Date.now(),
        }),
      },
      verified: true,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toHex(str: string): string {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }

  private fromHex(hex: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return String.fromCharCode(...bytes);
  }
}

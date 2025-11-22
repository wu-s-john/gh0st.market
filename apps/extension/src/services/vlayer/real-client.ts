import {
  VlayerProveOutputSchema,
  VlayerVerifyOutputSchema,
  type VlayerProveInput,
  type VlayerProveOutput,
  type VlayerVerifyOutput,
} from '~schemas';

import type { IVlayerClient, VlayerClientConfig } from './types';

const DEFAULT_BASE_URL = 'https://web-prover.vlayer.xyz/api/v1';

/**
 * Real vlayer Web Prover client that calls the actual API.
 */
export class VlayerClient implements IVlayerClient {
  private clientId: string;
  private secret: string;
  private baseUrl: string;

  constructor(config: VlayerClientConfig) {
    this.clientId = config.clientId;
    this.secret = config.secret;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async prove(input: VlayerProveInput): Promise<VlayerProveOutput> {
    const response = await fetch(`${this.baseUrl}/prove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        Authorization: `Bearer ${this.secret}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`vlayer prove failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return VlayerProveOutputSchema.parse(data);
  }

  async verify(presentation: VlayerProveOutput): Promise<VlayerVerifyOutput> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        Authorization: `Bearer ${this.secret}`,
      },
      body: JSON.stringify(presentation),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`vlayer verify failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return VlayerVerifyOutputSchema.parse(data);
  }
}

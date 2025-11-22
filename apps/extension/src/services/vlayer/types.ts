import type {
  VlayerProveInput,
  VlayerProveOutput,
  VlayerVerifyOutput,
} from '~schemas';

/**
 * Interface for vlayer Web Prover client.
 * Allows switching between real and mock implementations.
 */
export interface IVlayerClient {
  /**
   * Generate a cryptographic proof for a URL request.
   * @param input - The prove request parameters
   * @returns The presentation object containing the proof
   */
  prove(input: VlayerProveInput): Promise<VlayerProveOutput>;

  /**
   * Verify a presentation and extract the response data.
   * @param presentation - The presentation from prove()
   * @returns The verified response with extracted data
   */
  verify(presentation: VlayerProveOutput): Promise<VlayerVerifyOutput>;
}

/**
 * Configuration for the vlayer client.
 */
export interface VlayerClientConfig {
  clientId: string;
  secret: string;
  baseUrl?: string;
}

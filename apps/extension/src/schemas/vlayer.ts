import { z } from 'zod';

// ============================================
// INPUT SCHEMA - POST /api/v1/prove Request
// ============================================

export const VlayerProveInputSchema = z.object({
  /** HTTPS URL to make a request to and generate a proof for. Only HTTPS URLs are supported. */
  url: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Only HTTPS URLs are supported',
  }),

  /** HTTP method for the request. Defaults to GET. */
  method: z.string().optional().default('GET'),

  /** Array of HTTP headers formatted as "Header-Name: Header-Value" */
  headers: z.array(z.string()).optional(),

  /** Request body data for POST requests */
  body: z.string().optional(),

  /** URL of the notary server for TLS notarization. Defaults to vlayer test notary server. */
  notaryUrl: z.string().url().optional(),

  /** Optional override for target host */
  host: z.string().optional(),

  /** Optional maximum number of bytes to receive from the server */
  maxRecvData: z.number().int().optional(),
});

export type VlayerProveInput = z.infer<typeof VlayerProveInputSchema>;

// ============================================
// OUTPUT SCHEMA - POST /api/v1/prove Response
// ============================================

export const VlayerProveOutputSchema = z.object({
  /** Hex-encoded proof data */
  data: z.string(),

  /** Version of the TLSN protocol used */
  version: z.string(),

  /** Metadata about the proof */
  meta: z.object({
    /** URL of the notary service that was used */
    notaryUrl: z.string().url(),
  }),
});

export type VlayerProveOutput = z.infer<typeof VlayerProveOutputSchema>;

// ============================================
// INPUT SCHEMA - POST /api/v1/verify Request
// (Takes the presentation from prove response)
// ============================================

export const VlayerVerifyInputSchema = VlayerProveOutputSchema;

export type VlayerVerifyInput = z.infer<typeof VlayerVerifyInputSchema>;

// ============================================
// OUTPUT SCHEMA - POST /api/v1/verify Response
// ============================================

export const VlayerVerifyOutputSchema = z.object({
  /** The HTTP response from the target URL */
  response: z.object({
    /** HTTP status code */
    status: z.number().optional(),
    /** Response headers */
    headers: z.record(z.string(), z.string()).optional(),
    /** Response body content */
    body: z.string(),
  }),
  /** Whether the proof was successfully verified */
  verified: z.boolean().optional(),
});

export type VlayerVerifyOutput = z.infer<typeof VlayerVerifyOutputSchema>;

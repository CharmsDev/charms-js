import { AppType } from './utils.js';





// Network configuration for Bitcoin networks
export type BitcoinNetwork = 'mainnet' | 'testnet4';

export interface NetworkConfig {
  network?: BitcoinNetwork;
  apiBaseUrl?: string;
}

// Wallet-specific processed charm interface
export interface CharmObj {
  appId: string;
  amount: number;
  version: number;
  metadata: {
    ticker?: string;
    name?: string;
    description?: string;
    image?: string;
    image_hash?: string;
    url?: string;
  };
  app: Record<string, any>;
  outputIndex: number;
  txid: string;
  address: string;
}

/**
 * Standardized response format for charm extraction
 */
export interface CharmExtractionResult {
  success: boolean;
  charms: CharmObj[];
  message?: string;
  error?: string;
}

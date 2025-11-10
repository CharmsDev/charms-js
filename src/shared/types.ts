import { AppType } from './utils.js';





// Network configuration for Bitcoin networks
export type BitcoinNetwork = 'mainnet' | 'testnet4';

export interface NetworkConfig {
  network?: BitcoinNetwork;
  apiBaseUrl?: string;
}

/**
 * Represents a Charm extracted from a Bitcoin transaction.
 * Contains all metadata and identification information for the charm.
 */
export interface CharmObj {
  /** Unique identifier for the charm application */
  appId: string;
  
  /** Amount in satoshis */
  amount: number;
  
  /** Charm protocol version */
  version: number;
  
  /** Charm metadata (ticker, name, description, etc.) */
  metadata: {
    ticker?: string;
    name?: string;
    description?: string;
    image?: string;
    image_hash?: string;
    url?: string;
  };
  
  /** Full application data */
  app: Record<string, any>;
  
  /** Zero-based output index in the transaction (0, 1, 2, ...) */
  outputIndex: number;
  
  /** 
   * Transaction ID in display format (little-endian, reversed bytes).
   * This matches the format used by block explorers like mempool.space.
   * Use with outputIndex to identify the UTXO: `${txid}:${outputIndex}`
   */
  txid: string;
  
  /** 
   * Bitcoin address that controls this output.
   * Extracted from the output's scriptPubKey.
   * Supports P2PKH, P2SH, P2WPKH, P2WSH, and P2TR (Taproot).
   */
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

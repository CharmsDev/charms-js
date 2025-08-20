import { AppType } from './utils';

export interface ParsedCharmData {
  version: number;
  apps: Record<string, string>;
  ins: InputSummary[];
  outs: OutputSummary[];
  verified?: boolean;
  proof?: string; // Hex-encoded proof data
  error?: string;
}

export interface InputSummary {
  utxo_id: string;
}

export interface OutputSummary {
  address?: string;
  charms?: Record<string, number | CharmData>;
}

// Main charm data interface with genesis tracking and extensibility
export interface CharmData {
  ticker: string;
  remaining: number;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  image_hash?: string;
  decimals?: number;
  ref?: string;
  genesis_network?: string;  // Network where parent NFT was created
  genesis_tx?: string;       // Transaction ID of the parent NFT creation
  custom?: Record<string, any>; // For future extensibility
  [key: string]: any;
}

export interface CharmInstance {
  utxo: {
    tx: string;
    index: number;
  };
  address: string;
  appId: string;
  app: string | null;
  appType?: AppType;
  verified?: boolean;        // Verification status when VK provided
  value?: number;
  ticker?: string;
  remaining?: number;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  image_hash?: string;
  decimals?: number;
  ref?: string;
  genesis_network?: string;  // Network where parent NFT was created
  genesis_tx?: string;       // Transaction ID of the parent NFT creation
  custom?: Record<string, any>; // For future extensibility
  [key: string]: any;
}


// Maps charm app index to charm data
export type NormalizedCharms = Record<string, any>;

export interface NormalizedTransaction {
  ins?: string[];
  refs: string[];
  outs: NormalizedCharms[];
  beamed_outs?: Record<string, string>;
}

export interface NormalizedSpell {
  version: number;
  tx: NormalizedTransaction;
  app_public_inputs: Record<string, any>;
}

// Proof type (matches Rust implementation)
export type Proof = Uint8Array;

// Spell and proof tuple from CBOR
export interface SpellAndProof {
  spell: NormalizedSpell;
  proof: Proof;
}

export interface ErrorResponse {
  error: string;
}

// Network configuration for Bitcoin networks
export type BitcoinNetwork = 'mainnet' | 'testnet4';

export interface NetworkConfig {
  network?: BitcoinNetwork;
  apiBaseUrl?: string;
}

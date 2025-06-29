import { AppType } from './utils';

export interface CharmSummary {
  version: number;
  apps: Record<string, string>;
  ins: InputSummary[];
  outs: OutputSummary[];
  error?: string;
}

export interface InputSummary {
  utxo_id: string;
}

export interface OutputSummary {
  address?: string;
  charms?: Record<string, number | CharmData>;
}

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
  [key: string]: any;
}

export interface DetailedCharm {
  utxo: {
    tx: string;
    index: number;
  };
  address: string;
  appId: string;
  app: string | null;
  appType?: AppType;
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
  [key: string]: any;
}

export interface DecodedSpell {
  version: number;
  tx: {
    refs: any[];
    outs: any[];
    ins?: any[];
  };
  app_public_inputs: Record<string, any>;
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

export interface ErrorResponse {
  error: string;
}

// Type guard for error response
export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === 'object' && 'error' in obj;
}

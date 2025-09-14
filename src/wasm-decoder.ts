/**
 * WASM-based decoder for Charms.js
 * Simplified implementation using charms-lib WASM module
 */

import { extractAndVerifySpell } from './wasm-wrapper';
import { reconstructAppId } from './formatter';

export interface CharmInstance {
  utxo: {
    tx: string;
    index: number;
  };
  address: string;
  appId: string;
  app: Record<string, any> | null;
  appType?: string;
  ticker?: string;
  remaining?: number;
  value?: number;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  image_hash?: string;
  decimals?: number;
  ref?: string;
  custom?: Record<string, any>;
  verified?: boolean;
}

/**
 * Decode transaction using WASM spell extraction
 * @param txHex - Transaction hex string
 * @returns Array of CharmInstance objects
 */
export async function decodeTransactionWithWasm(txHex: string): Promise<CharmInstance[]> {
  try {
    // Extract and verify spell using WASM
    const spellData = await extractAndVerifySpell(txHex, false);
    
    if (!spellData) {
      return [];
    }

    console.log('WASM extracted spell data:', JSON.stringify(spellData, null, 2));

    // Convert WASM output to CharmInstance format
    return convertWasmDataToCharms(spellData, txHex);
    
  } catch (error) {
    console.error('WASM decoding failed:', error);
    throw error;
  }
}

/**
 * Convert WASM spell data to CharmInstance array
 */
function convertWasmDataToCharms(spellData: any, txHex: string): CharmInstance[] {
  const charms: CharmInstance[] = [];
  
  // Extract transaction ID from hex (first 32 bytes reversed)
  const txId = extractTxIdFromHex(txHex);
  
  // Process spell data structure
  if (spellData.tx && spellData.tx.outs) {
    spellData.tx.outs.forEach((output: any, index: number) => {
      // Extract value from output
      const value = extractValueFromOutput(output);
      
      if (value > 0) {
        // Reconstruct app ID from app_public_inputs
        const appId = reconstructAppId(spellData, '$0000');
        
        // Extract app data
        const appData = extractAppData(spellData.app_public_inputs);
        
        const charm: CharmInstance = {
          utxo: {
            tx: txId,
            index: index
          },
          address: '', // Will be filled by address derivation if needed
          appId: appId,
          app: appData,
          appType: 'unknown',
          value: value,
          verified: true // WASM verification passed
        };
        
        charms.push(charm);
      }
    });
  }
  
  return charms;
}

/**
 * Extract transaction ID from hex string
 */
function extractTxIdFromHex(txHex: string): string {
  // This is a simplified version - in practice, we'd need to properly parse the transaction
  // For now, we'll use a placeholder that can be filled by the calling code
  return 'PLACEHOLDER_TX_ID';
}

/**
 * Extract value from output object
 */
function extractValueFromOutput(output: any): number {
  if (typeof output === 'object') {
    // Look for numeric values in the output
    for (const [key, value] of Object.entries(output)) {
      if (typeof value === 'number' && value > 0) {
        return value;
      }
    }
  }
  return 0;
}

/**
 * Extract app data from app_public_inputs
 */
function extractAppData(appPublicInputs: any): Record<string, any> | null {
  if (!appPublicInputs) {
    return null;
  }
  
  // If it's already an object with app data, return it
  if (typeof appPublicInputs === 'object') {
    // Filter out the app ID keys and keep only the app data
    const appData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(appPublicInputs)) {
      // Skip app ID keys (they start with 't/')
      if (typeof key === 'string' && !key.startsWith('t/')) {
        appData[key] = value;
      } else if (typeof key === 'string' && key.startsWith('t/') && value && typeof value === 'object') {
        // If the value contains app data, merge it
        Object.assign(appData, value);
      }
    }
    
    return Object.keys(appData).length > 0 ? appData : {};
  }
  
  return {};
}

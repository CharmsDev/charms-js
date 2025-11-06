import * as bitcoin from 'bitcoinjs-lib';
import { CharmObj, BitcoinNetwork, NetworkConfig, CharmExtractionResult } from './shared/types.js';
import { initializeWasm, isWasmAvailable, extractCharmsWithWasm, getWasmInfo } from './shared/wasm-integration.js';

/**
 * Extract and verify spell from transaction using WASM exclusively
 * @param txHex - Transaction hex string
 * @param network - Bitcoin network (optional, defaults to testnet4)
 * @returns Promise resolving to CharmExtractionResult with standardized response
 */
export async function extractAndVerifySpell(txHex: string, network: BitcoinNetwork = 'testnet4'): Promise<CharmExtractionResult> {
    if (!isWasmAvailable()) {
        return {
            success: false,
            charms: [],
            error: 'WASM module not available. Call initializeWasm() first.'
        };
    }

    const txId = extractTxIdFromHex(txHex);
    const result = await extractCharmsWithWasm(txHex, txId, network);
    return result;
}

/**
 * Extract transaction ID from hex (simplified version)
 */
function extractTxIdFromHex(txHex: string): string {
  try {
    const tx = bitcoin.Transaction.fromHex(txHex);
    return tx.getId();
  } catch (error) {
    throw new Error('Invalid transaction hex format');
  }
}


// Fetch transaction hex from API
export async function fetchTransactionHex(txId: string, config?: NetworkConfig): Promise<string | null> {
  const network = config?.network || 'testnet4';
  const baseUrl = config?.apiBaseUrl || (network === 'mainnet' 
    ? 'https://mempool.space/api/tx' 
    : 'https://mempool.space/testnet4/api/tx');
  
  try {
    const response = await fetch(`${baseUrl}/${txId}/hex`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}




export * from './shared/types.js';
export * from './shared/utils.js';

// WASM Integration exports
export { initializeWasm, isWasmAvailable, getWasmInfo, extractCharmsWithWasm } from './shared/wasm-integration.js';

// Wallet adapter exports
export { normalizeCharmForWallet, extractCharmsForWallet } from './shared/wallet-adapter.js';



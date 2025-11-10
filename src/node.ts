import { Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { CharmObj, BitcoinNetwork, NetworkConfig, CharmExtractionResult } from './shared/types.js';
import { initializeWasm, isWasmAvailable, extractCharmsWithWasm, getWasmInfo } from './shared/wasm-integration.js';

/**
 * Extracts and verifies charms from a Bitcoin transaction.
 * 
 * @param txHex - Raw transaction in hexadecimal format
 * @param network - Bitcoin network ('mainnet' or 'testnet4')
 * @returns Extraction result containing charms array and success status
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
 * Computes the transaction ID from raw transaction hex.
 * Handles SegWit transactions correctly by excluding witness data from the hash.
 * 
 * @param txHex - Raw transaction in hexadecimal format
 * @returns Transaction ID in standard display format (reversed byte order)
 */
function extractTxIdFromHex(txHex: string): string {
  try {
    const txBytes = hex.decode(txHex);
    const tx = Transaction.fromRaw(txBytes);
    
    // Transaction ID is the double SHA256 of the transaction without witness data
    // Reverse byte order for standard display format
    const txIdBytes = hex.decode(tx.id);
    const reversed = new Uint8Array(txIdBytes).reverse();
    return hex.encode(reversed);
  } catch (error) {
    throw new Error('Invalid transaction hex format');
  }
}

/**
 * Fetches raw transaction hex from mempool.space API.
 * 
 * @param txId - Transaction ID to fetch
 * @param config - Optional network configuration
 * @returns Transaction hex string, or null if not found
 */
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



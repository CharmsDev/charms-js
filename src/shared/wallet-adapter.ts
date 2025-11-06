/**
 * Wallet adapter for charms-js
 * Filters CharmObj objects by wallet outpoints
 */

import { CharmObj } from './types.js';

/**
 * Convert CharmObj to wallet-compatible format (filtering by wallet outpoints)
 */
export function normalizeCharmForWallet(
    charmObj: CharmObj, 
    txId: string, 
    walletOutpoints: Set<string>,
    utxoValue?: number
): CharmObj | null {
    const outIndex = charmObj.outputIndex;
    const belongsToWallet = outIndex !== undefined && walletOutpoints.has(`${txId}:${outIndex}`);

    if (!belongsToWallet) {
        return null;
    }

    // Return the CharmObj as-is since it's already in the correct format
    return charmObj;
}

/**
 * Extract charms for wallet with built-in normalization
 */
export async function extractCharmsForWallet(
    txHex: string, 
    txId: string, 
    walletOutpoints: Set<string>,
    network: 'mainnet' | 'testnet4' = 'testnet4'
): Promise<CharmObj[]> {
    // Import here to avoid circular dependencies
    const { extractAndVerifySpell } = await import('../node.js');
    
    try {
        const extractionResult = await extractAndVerifySpell(txHex, network);
        
        if (!extractionResult.success) {
            return [];
        }
        
        if (!extractionResult.charms || extractionResult.charms.length === 0) {
            return [];
        }
        
        const processedCharms: CharmObj[] = [];
        
        for (const charmObj of extractionResult.charms) {
            const processedCharm = normalizeCharmForWallet(charmObj, txId, walletOutpoints, 0);
            if (processedCharm) {
                processedCharms.push(processedCharm);
            }
        }
        
        return processedCharms;
    } catch (error) {
        return [];
    }
}

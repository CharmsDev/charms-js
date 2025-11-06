/**
 * WASM Integration for Charms.js
 * Provides a simplified API that uses WASM when available, falls back to current implementation
 */

import { CharmObj, CharmExtractionResult } from './types.js';
import { extractAddress } from '../address.js';

// WASM module reference
let wasmModule: any = null;

/**
 * Initialize WASM module (to be called by consuming applications)
 * @param wasm - The loaded WASM module
 */
export function initializeWasm(wasm: any): void {
    wasmModule = wasm;
}

/**
 * Check if WASM is available
 */
export function isWasmAvailable(): boolean {
    return wasmModule !== null && typeof wasmModule.extractAndVerifySpell === 'function';
}

/**
 * Extract charms using WASM (when available)
 * @param txHex - Transaction hex string
 * @param txId - Transaction ID
 * @returns Standardized CharmExtractionResult
 */
export async function extractCharmsWithWasm(txHex: string, txId: string, network: 'mainnet' | 'testnet4' = 'testnet4'): Promise<CharmExtractionResult> {
    if (!isWasmAvailable()) {
        return {
            success: false,
            charms: [],
            error: 'WASM module not initialized. Call initializeWasm() first.'
        };
    }

    try {
        const param = { "Bitcoin": txHex };
        // Try with mock mode enabled first (for test transactions)
        let wasmResult;
        try {
            wasmResult = await wasmModule.extractAndVerifySpell(param, true); // mock mode = true
        } catch (mockError) {
            try {
                wasmResult = await wasmModule.extractAndVerifySpell(param, false); // mock mode = false
            } catch (prodError) {
                // Both modes failed - this is expected for transactions without charms
                return {
                    success: true,
                    charms: [],
                    message: 'No charms found in transaction'
                };
            }
        }
        
        // Debug the structure of app_public_inputs
        if (!wasmResult || !wasmResult.app_public_inputs || !wasmResult.tx) {
            return {
                success: true,
                charms: [],
                message: 'No valid charm data found in transaction'
            };
        }

        const charmObjects = convertWasmResultToCharms(wasmResult, txId, network, txHex);
        
        return {
            success: true,
            charms: charmObjects,
            message: charmObjects.length > 0 ? `Found ${charmObjects.length} charm(s)` : 'No charms found in transaction'
        };
    } catch (error) {
        return {
            success: false,
            charms: [],
            error: `WASM extraction failed: ${(error as Error).message}`
        };
    }
}

/**
 * Find transaction hex in app data
 */
function findTransactionHexInAppData(appData: Record<string, any>): string | null {
    // Look for Bitcoin field that contains transaction hex
    if (appData.Bitcoin && typeof appData.Bitcoin === 'string' && appData.Bitcoin.length > 100) {
        return appData.Bitcoin;
    }
    
    // Look for other fields that might contain transaction hex
    for (const [key, value] of Object.entries(appData)) {
        if (typeof value === 'string' && value.length > 100 && /^[0-9a-fA-F]+$/.test(value)) {
            return value;
        }
    }
    
    return null;
}

/**
 * Extract scriptPubKey from transaction hex for a specific output index
 */
function extractScriptPubKeyFromTxHex(txHex: string, outputIndex: number): string | null {
    try {
        
        // Parse Bitcoin transaction structure properly
        // Structure: version(4) + input_count(varint) + inputs + output_count(varint) + outputs + locktime(4)
        
        let pos = 0;
        
        // Skip version (4 bytes = 8 hex chars)
        pos += 8;
        
        // Skip witness flag if present (00 01)
        if (txHex.slice(pos, pos + 4) === '0001') {
            pos += 4;
        }
        
        // Read input count (varint)
        const inputCount = parseInt(txHex.slice(pos, pos + 2), 16);
        pos += 2;
        
        // Skip all inputs
        for (let i = 0; i < inputCount; i++) {
            // Skip txid (32 bytes = 64 hex chars)
            pos += 64;
            // Skip vout (4 bytes = 8 hex chars)
            pos += 8;
            // Read script length
            const scriptLen = parseInt(txHex.slice(pos, pos + 2), 16);
            pos += 2;
            // Skip script
            pos += scriptLen * 2;
            // Skip sequence (4 bytes = 8 hex chars)
            pos += 8;
        }
        
        // Read output count
        const outputCount = parseInt(txHex.slice(pos, pos + 2), 16);
        pos += 2;
        
        // Parse outputs to find the one we want
        for (let i = 0; i < outputCount; i++) {
            // Read amount (8 bytes = 16 hex chars)
            const amount = txHex.slice(pos, pos + 16);
            pos += 16;
            
            // Read script length
            const scriptLen = parseInt(txHex.slice(pos, pos + 2), 16);
            pos += 2;
            
            // Read script
            const script = txHex.slice(pos, pos + scriptLen * 2);
            pos += scriptLen * 2;
            
            
            if (i === outputIndex) {
                return script;
            }
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Derive address from scriptPubKey hex using the extractAddress function
 */
function deriveAddressFromScriptPubKey(scriptPubKey: string, network: 'mainnet' | 'testnet4' = 'testnet4'): string {
    try {
        // Convert scriptPubKey hex to Buffer
        const scriptBuffer = Buffer.from(scriptPubKey, 'hex');
        
        // Use the extractAddress function which supports P2TR (Taproot) with network parameter
        const address = extractAddress(scriptBuffer, network);
        
        return address;
    } catch (error) {
        // If extraction fails, return empty string
        return '';
    }
}

/**
 * Convert WASM result to CharmObj array
 */
function convertWasmResultToCharms(wasmResult: any, txId: string, network: 'mainnet' | 'testnet4' = 'testnet4', txHex?: string): CharmObj[] {
    const charms: CharmObj[] = [];
    
    // Extract transaction hex for address derivation - use provided txHex or extract from app_public_inputs
    let transactionHex: string | null = txHex || null;
    
    // Build a map of appId -> app data (excluding transaction hex)
    const appDataMap = new Map<string, Record<string, any>>();
    
    if (wasmResult.app_public_inputs) {
        const entries: [string, any][] = wasmResult.app_public_inputs instanceof Map 
            ? Array.from(wasmResult.app_public_inputs.entries())
            : Object.entries(wasmResult.app_public_inputs);
        
        for (const [appId, value] of entries) {
            const appData: Record<string, any> = {};
            
            if (value && typeof value === 'object') {
                const valueEntries = value instanceof Map 
                    ? Array.from(value.entries())
                    : Object.entries(value);
                
                for (const [subKey, subValue] of valueEntries) {
                    // Store transaction hex if found
                    if (subKey === 'Bitcoin' && typeof subValue === 'string' && subValue.length > 100) {
                        transactionHex = subValue;
                        continue; // Don't include in app data
                    }
                    
                    // Add to app data
                    appData[subKey] = subValue;
                }
            }
            
            appDataMap.set(appId, appData);
        }
    }
    
    // If no app data found, return empty array
    if (appDataMap.size === 0) {
        return [];
    }

    // Process transaction outputs - only create charms for outputs that have charm data
    if (wasmResult.tx && wasmResult.tx.outs && wasmResult.tx.outs.length > 0) {
        wasmResult.tx.outs.forEach((outputCharms: any, outputIndex: number) => {
            // outputCharms is a Map or Object of { appIndex: charmData }
            // Only process if this output has charms
            
            const charmEntries = outputCharms instanceof Map 
                ? Array.from(outputCharms.entries())
                : Object.entries(outputCharms);
            
            // Skip empty outputs
            if (charmEntries.length === 0) {
                return;
            }
            
            // Extract address for this output
            let address = '';
            try {
                if (transactionHex) {
                    const scriptPubKey = extractScriptPubKeyFromTxHex(transactionHex, outputIndex);
                    
                    if (scriptPubKey) {
                        // Check if this is an OP_RETURN script (starts with 6a)
                        if (scriptPubKey.startsWith('6a')) {
                            // For OP_RETURN outputs, find the first non-OP_RETURN output
                            for (let i = 0; i < 10; i++) {
                                if (i === outputIndex) continue;
                                
                                const altScriptPubKey = extractScriptPubKeyFromTxHex(transactionHex, i);
                                if (altScriptPubKey && !altScriptPubKey.startsWith('6a')) {
                                    address = deriveAddressFromScriptPubKey(altScriptPubKey, network);
                                    if (address) break;
                                }
                            }
                        } else {
                            address = deriveAddressFromScriptPubKey(scriptPubKey, network);
                        }
                    }
                }
            } catch (error) {
                // Address extraction failed, continue with empty address
            }
            
            // Create a charm for each app in this output
            for (const [appIndexOrId, charmData] of charmEntries) {
                // Get the appId - it could be a numeric index or the appId itself
                let appId: string;
                let appData: Record<string, any> = {};
                
                // Try to find the app by index
                const appIndex = typeof appIndexOrId === 'number' ? appIndexOrId : parseInt(appIndexOrId);
                if (!isNaN(appIndex)) {
                    // Get the appId by index
                    const appIds = Array.from(appDataMap.keys());
                    if (appIndex < appIds.length) {
                        appId = appIds[appIndex];
                        appData = appDataMap.get(appId) || {};
                    } else {
                        // Index out of bounds, skip
                        continue;
                    }
                } else {
                    // Use the key as appId directly
                    appId = appIndexOrId;
                    appData = appDataMap.get(appId) || {};
                }
                
                // Extract amount from charm data
                let amount = 0;
                if (typeof charmData === 'number') {
                    amount = charmData;
                } else if (charmData && typeof charmData === 'object') {
                    // Try common field names
                    if (typeof charmData.amount === 'number') {
                        amount = charmData.amount;
                    } else if (typeof charmData.remaining === 'number') {
                        amount = charmData.remaining;
                    } else if (typeof charmData.value === 'number') {
                        amount = charmData.value;
                    }
                    
                    // Merge charm-specific data into app data
                    if (charmData instanceof Map) {
                        for (const [k, v] of charmData.entries()) {
                            if (k !== 'amount' && k !== 'remaining' && k !== 'value') {
                                appData[k] = v;
                            }
                        }
                    } else {
                        for (const [k, v] of Object.entries(charmData)) {
                            if (k !== 'amount' && k !== 'remaining' && k !== 'value') {
                                appData[k] = v;
                            }
                        }
                    }
                }
                
                // Create CharmObj
                const charm: CharmObj = {
                    appId: appId,
                    amount: amount,
                    version: wasmResult.version,
                    metadata: {
                        ticker: appData.ticker,
                        name: appData.name,
                        description: appData.description,
                        image: appData.image,
                        image_hash: appData.image_hash,
                        url: appData.url
                    },
                    app: appData,
                    outputIndex: outputIndex,
                    txid: txId,
                    address: address
                };
                
                charms.push(charm);
            }
        });
    }
    
    return charms;
}

/**
 * Get WASM module info for debugging
 */
export function getWasmInfo(): any {
    if (!wasmModule) {
        return { available: false, module: null };
    }
    
    return {
        available: true,
        hasExtractAndVerifySpell: typeof wasmModule.extractAndVerifySpell === 'function',
        moduleKeys: Object.keys(wasmModule)
    };
}

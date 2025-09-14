/**
 * WASM Integration for Charms.js
 * Provides a simplified API that uses WASM when available, falls back to current implementation
 */

import { CharmInstance } from './types';
import { createCharmInstances } from './formatter';

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
 * @returns Array of CharmInstance objects
 */
export async function extractCharmsWithWasm(txHex: string, txId: string): Promise<CharmInstance[]> {
    if (!isWasmAvailable()) {
        throw new Error('WASM module not initialized. Call initializeWasm() first.');
    }

    try {
        // Use the same parameter format as the wallet
        const param = { "bitcoin": txHex };
        const wasmResult = await wasmModule.extractAndVerifySpell(param, false);
        
        if (!wasmResult || !wasmResult.app_public_inputs || !wasmResult.tx) {
            return [];
        }

        console.log('WASM extracted data:', {
            hasAppPublicInputs: !!wasmResult.app_public_inputs,
            appPublicInputsType: typeof wasmResult.app_public_inputs,
            isMap: wasmResult.app_public_inputs instanceof Map,
            hasTx: !!wasmResult.tx,
            txOutsLength: wasmResult.tx?.outs?.length
        });

        // Convert WASM result to CharmInstance format
        return convertWasmResultToCharms(wasmResult, txId);
        
    } catch (error) {
        console.error('WASM extraction failed:', error);
        throw error;
    }
}

/**
 * Convert WASM result to CharmInstance array
 */
function convertWasmResultToCharms(wasmResult: any, txId: string): CharmInstance[] {
    const charms: CharmInstance[] = [];
    
    // Extract app ID from app_public_inputs Map (same logic as wallet)
    let appId = '$0000';
    if (wasmResult.app_public_inputs instanceof Map && wasmResult.app_public_inputs.size > 0) {
        const firstKey = Array.from(wasmResult.app_public_inputs.keys())[0];
        if (Array.isArray(firstKey) && firstKey.length >= 65 && firstKey[0] === 't') {
            // Convert array format to canonical string format
            const hash1Bytes = firstKey.slice(1, 33);
            const hash2Bytes = firstKey.slice(33, 65);
            const hash1 = Buffer.from(hash1Bytes).toString('hex');
            const hash2 = Buffer.from(hash2Bytes).toString('hex');
            appId = `t/${hash1}/${hash2}`;
        }
    }

    // Extract app data from the Map values
    let appData: Record<string, any> = {};
    if (wasmResult.app_public_inputs instanceof Map) {
        for (const [key, value] of wasmResult.app_public_inputs.entries()) {
            if (value && typeof value === 'object') {
                Object.assign(appData, value);
            }
        }
    }

    // Process transaction outputs
    if (wasmResult.tx && wasmResult.tx.outs) {
        wasmResult.tx.outs.forEach((output: any, index: number) => {
            // Extract value from output
            let value = 0;
            if (typeof output === 'object') {
                for (const [key, val] of Object.entries(output)) {
                    if (typeof val === 'number' && val > 0) {
                        value = val;
                        break;
                    }
                }
            }

            if (value > 0) {
                const charm: CharmInstance = {
                    utxo: {
                        tx: txId,
                        index: index
                    },
                    address: '', // Will be filled by address derivation if needed
                    appId: appId,
                    app: null, // Will be set to string format if needed
                    appType: undefined,
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

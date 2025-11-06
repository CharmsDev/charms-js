/**
 * Browser-ready version of charms-js with automatic WASM initialization
 */

import { CharmObj, BitcoinNetwork, CharmExtractionResult } from './shared/types.js';
import { initializeWasm, extractCharmsWithWasm } from './shared/wasm-integration.js';
import { extractCharmsForWallet as nodeExtractCharmsForWallet } from './shared/wallet-adapter.js';

let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

async function autoInitWasm(): Promise<void> {
    if (wasmInitialized) return;
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        // @ts-ignore
        const wasmBindings = await import('./wasm/charms_lib_bg.js') as any;
        const paths = ['/charms_lib_bg.wasm', '/wasm/charms_lib_bg.wasm'];
        
        let wasmBuffer: ArrayBuffer | null = null;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    wasmBuffer = await response.arrayBuffer();
                    break;
                }
            } catch (e) { continue; }
        }
        
        if (!wasmBuffer) throw new Error('WASM file not found');
        
        const instance = await WebAssembly.instantiate(wasmBuffer, {
            './charms_lib_bg.js': wasmBindings
        });
        
        wasmBindings.__wbg_set_wasm(instance.instance.exports);
        initializeWasm(wasmBindings);
        wasmInitialized = true;
    })();
    
    return initPromise;
}

/**
 * Extract charms for wallet - Browser version with auto-init
 */
export async function extractCharmsForWallet(
    txHex: string, 
    txId: string, 
    walletOutpoints: Set<string>, 
    network: BitcoinNetwork = 'testnet4'
): Promise<CharmObj[]> {
    await autoInitWasm();
    return nodeExtractCharmsForWallet(txHex, txId, walletOutpoints, network);
}

/**
 * Extract and verify spell - Browser version with auto-init
 */
export async function extractAndVerifySpell(
    txHex: string, 
    network: BitcoinNetwork = 'testnet4',
    txId?: string
): Promise<CharmExtractionResult> {
    await autoInitWasm();
    
    // If txId is not provided, calculate it from the transaction hex
    let calculatedTxId = txId || '';
    if (!calculatedTxId && txHex) {
        calculatedTxId = await calculateTxIdFromHex(txHex);
    }
    
    return extractCharmsWithWasm(txHex, calculatedTxId, network);
}

/**
 * Calculate transaction ID from transaction hex
 */
async function calculateTxIdFromHex(txHex: string): Promise<string> {
    try {
        // For Bitcoin, txid is the double SHA256 hash of the transaction, reversed
        // This is a simplified implementation - in production you'd use a proper Bitcoin library
        
        // Convert hex to bytes
        const txBytes = new Uint8Array(txHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        
        // Calculate SHA256 hash twice
        const hash1 = await crypto.subtle.digest('SHA-256', txBytes);
        const hash2 = await crypto.subtle.digest('SHA-256', hash1);
        
        // Reverse the bytes and convert to hex
        const hashArray = new Uint8Array(hash2);
        const reversedHash = Array.from(hashArray).reverse();
        return reversedHash.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        return '';
    }
}

export function isWasmReady(): boolean {
    return wasmInitialized;
}

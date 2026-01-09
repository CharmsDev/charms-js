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
        // @ts-ignore - Import the bundler target WASM module (auto-initialized by Webpack)
        const wasmModule = await import('../src/wasm/charms_lib.js') as any;
        
        // Pass the module to our integration layer
        // Bundler target auto-initializes, no default() call needed
        initializeWasm(wasmModule);
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
 * @param txHex - Transaction hex string
 * @param network - Network type ('mainnet' or 'testnet4')
 * @param txId - Optional transaction ID (will be calculated if not provided)
 * @param mock - If true, skip verification (for mock proofs). Default: false
 */
export async function extractAndVerifySpell(
    txHex: string, 
    network: BitcoinNetwork = 'testnet4',
    txId?: string,
    mock: boolean = false
): Promise<CharmExtractionResult> {
    await autoInitWasm();
    
    // If txId is not provided, calculate it from the transaction hex
    let calculatedTxId = txId || '';
    if (!calculatedTxId && txHex) {
        calculatedTxId = await calculateTxIdFromHex(txHex);
    }
    
    return extractCharmsWithWasm(txHex, calculatedTxId, network, mock);
}

/**
 * Calculate transaction ID from transaction hex
 * For SegWit transactions, the txId is calculated from the legacy format (without witness data)
 */
async function calculateTxIdFromHex(txHex: string): Promise<string> {
    try {
        // Convert hex to bytes
        const txBytes = new Uint8Array(txHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        
        // Check if this is a SegWit transaction (marker=0x00, flag=0x01 after version)
        const isSegWit = txBytes.length > 5 && txBytes[4] === 0x00 && txBytes[5] === 0x01;
        
        let txBytesForHash: Uint8Array;
        
        if (isSegWit) {
            // For SegWit, we need to remove the marker, flag, and witness data
            // and reconstruct the legacy transaction format
            txBytesForHash = removeWitnessData(txBytes);
        } else {
            // For non-SegWit, use the full transaction
            txBytesForHash = txBytes;
        }
        
        // Calculate SHA256 hash twice
        const hash1 = await crypto.subtle.digest('SHA-256', txBytesForHash);
        const hash2 = await crypto.subtle.digest('SHA-256', hash1);
        
        // Reverse the bytes and convert to hex
        const hashArray = new Uint8Array(hash2);
        const reversedHash = Array.from(hashArray).reverse();
        return reversedHash.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        return '';
    }
}

/**
 * Remove witness data from a SegWit transaction to get the legacy format
 */
function removeWitnessData(txBytes: Uint8Array): Uint8Array {
    const result: number[] = [];
    let pos = 0;
    
    // Version (4 bytes)
    for (let i = 0; i < 4; i++) {
        result.push(txBytes[pos++]);
    }
    
    // Skip marker and flag (2 bytes)
    pos += 2;
    
    // Input count (varint)
    const inputCount = readVarInt(txBytes, pos);
    pos = inputCount.newPos;
    writeVarInt(result, inputCount.value);
    
    // Inputs (without witness data)
    for (let i = 0; i < inputCount.value; i++) {
        // Previous output (32 bytes txid + 4 bytes vout)
        for (let j = 0; j < 36; j++) {
            result.push(txBytes[pos++]);
        }
        
        // Script length (varint)
        const scriptLen = readVarInt(txBytes, pos);
        pos = scriptLen.newPos;
        writeVarInt(result, scriptLen.value);
        
        // Script
        for (let j = 0; j < scriptLen.value; j++) {
            result.push(txBytes[pos++]);
        }
        
        // Sequence (4 bytes)
        for (let j = 0; j < 4; j++) {
            result.push(txBytes[pos++]);
        }
    }
    
    // Output count (varint)
    const outputCount = readVarInt(txBytes, pos);
    pos = outputCount.newPos;
    writeVarInt(result, outputCount.value);
    
    // Outputs
    for (let i = 0; i < outputCount.value; i++) {
        // Amount (8 bytes)
        for (let j = 0; j < 8; j++) {
            result.push(txBytes[pos++]);
        }
        
        // Script length (varint)
        const scriptLen = readVarInt(txBytes, pos);
        pos = scriptLen.newPos;
        writeVarInt(result, scriptLen.value);
        
        // Script
        for (let j = 0; j < scriptLen.value; j++) {
            result.push(txBytes[pos++]);
        }
    }
    
    // Skip witness data (everything between outputs and locktime)
    // Find locktime (last 4 bytes)
    const locktime = txBytes.slice(txBytes.length - 4);
    
    // Locktime (4 bytes)
    for (let i = 0; i < 4; i++) {
        result.push(locktime[i]);
    }
    
    return new Uint8Array(result);
}

/**
 * Read a variable-length integer (varint)
 */
function readVarInt(bytes: Uint8Array, pos: number): { value: number; newPos: number } {
    const first = bytes[pos];
    if (first < 0xfd) {
        return { value: first, newPos: pos + 1 };
    } else if (first === 0xfd) {
        return { value: bytes[pos + 1] | (bytes[pos + 2] << 8), newPos: pos + 3 };
    } else if (first === 0xfe) {
        return { 
            value: bytes[pos + 1] | (bytes[pos + 2] << 8) | (bytes[pos + 3] << 16) | (bytes[pos + 4] << 24),
            newPos: pos + 5 
        };
    } else {
        // 0xff - 8 byte integer (not commonly used, simplified here)
        return { value: 0, newPos: pos + 9 };
    }
}

/**
 * Write a variable-length integer (varint)
 */
function writeVarInt(result: number[], value: number): void {
    if (value < 0xfd) {
        result.push(value);
    } else if (value <= 0xffff) {
        result.push(0xfd);
        result.push(value & 0xff);
        result.push((value >> 8) & 0xff);
    } else if (value <= 0xffffffff) {
        result.push(0xfe);
        result.push(value & 0xff);
        result.push((value >> 8) & 0xff);
        result.push((value >> 16) & 0xff);
        result.push((value >> 24) & 0xff);
    } else {
        // 8 byte integer (not implemented)
        result.push(0xff);
        for (let i = 0; i < 8; i++) {
            result.push(0);
        }
    }
}

export function isWasmReady(): boolean {
    return wasmInitialized;
}

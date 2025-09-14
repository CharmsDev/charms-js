/**
 * WASM wrapper for Charms.js - simplified integration
 * Uses charms-lib WASM module for spell extraction and verification
 */

let wasmModule: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

/**
 * Load the WASM module (singleton pattern)
 */
async function loadWasmModule(): Promise<any> {
    if (wasmModule) {
        return wasmModule;
    }
    
    if (loadPromise) {
        return loadPromise;
    }
    
    if (isLoading) {
        // Wait for loading to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return wasmModule;
    }
    
    isLoading = true;
    
    try {
        loadPromise = import('./wasm/charms_lib.js');
        wasmModule = await loadPromise;
        return wasmModule;
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        throw new Error(`WASM module loading failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        isLoading = false;
        loadPromise = null;
    }
}

/**
 * Extract and verify spell from transaction hex using WASM
 * @param txHex - Transaction hex string
 * @param mock - Whether to use mock mode (default: false)
 * @returns Parsed spell data with verification
 */
export async function extractAndVerifySpell(txHex: string, mock: boolean = false): Promise<any> {
    const wasm = await loadWasmModule();
    
    if (!wasm.extractAndVerifySpell) {
        throw new Error('extractAndVerifySpell function not available in WASM module');
    }
    
    try {
        // Use the same parameter format as the wallet
        const param = { "bitcoin": txHex };
        const result = wasm.extractAndVerifySpell(param, mock);
        return result;
    } catch (error) {
        throw new Error(`WASM spell extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Check if WASM module is ready
 */
export function isWasmReady(): boolean {
    return wasmModule !== null && !isLoading;
}

/**
 * Preload WASM module (optional, for better performance)
 */
export async function preloadWasm(): Promise<void> {
    await loadWasmModule();
}

/**
 * Local Test for Charm Extraction Debugging
 * Tests the same flow as the wallet to debug CharmObj parsing
 */

import { extractAndVerifySpell, initializeWasm } from '../src/index';

// https://mempool.space/tx/e98a008ef590d623c016b0203b984a33aa54bb9b0475607c6fbef1981291948d
// Test transactions - using known mainnet transaction with charms
const TEST_TRANSACTIONS = [
    {
        id: 'e98a008ef590d623c016b0203b984a33aa54bb9b0475607c6fbef1981291948d',
        network: 'mainnet',
        description: 'Known mainnet transaction with charms'
    }
];

async function initWasm() {
    const wasmBindings = require('../src/wasm/charms_lib_bg.js');
    const wasmPath = require('path').join(__dirname, '../src/wasm/charms_lib_bg.wasm');
    const wasmBuffer = require('fs').readFileSync(wasmPath);
    
    const imports = {
        './charms_lib_bg.js': wasmBindings
    };
    
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, imports);
    wasmBindings.__wbg_set_wasm(wasmModule.instance.exports);
    
    initializeWasm(wasmBindings);
}

async function debugCharmExtraction() {
    // Initialize WASM first
    try {
        await initWasm();
    } catch (error) {
        return;
    }
    
    // Test each transaction
    for (const tx of TEST_TRANSACTIONS) {
        await testTransaction(tx);
    }
}

async function testTransaction(tx: { id: string, network: string, description: string }) {
    try {
        // Fetch transaction hex from appropriate network
        const apiUrl = tx.network === 'mainnet' 
            ? `https://mempool.space/api/tx/${tx.id}/hex`
            : `https://mempool.space/testnet4/api/tx/${tx.id}/hex`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return;
        }
        
        const txHex = await response.text();
        // Extract charms using same method as wallet
        const result = await extractAndVerifySpell(txHex, tx.network as any);
        
        if (result.charms.length > 0) {
            console.log(JSON.stringify(result.charms, null, 2));
        }
        
    } catch (error) {
        // Silent error handling
    }
}

// Run the test
debugCharmExtraction().catch(() => {});

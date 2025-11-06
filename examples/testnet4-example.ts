/**
 * Testnet4 Charms Demo
 * Shows real charm extraction from testnet4 transactions
 */

import { initializeWasm, extractCharmsForWallet } from '../dist/node';
import * as fs from 'fs';
import * as path from 'path';

// Real testnet4 transactions with charms
const TESTNET4_TRANSACTIONS = [
    '1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c',
    '86081de981f11ba05701dd20be846897b6154d510abef824895c7a8282f131a9'
];

async function testnet4Demo() {
    console.log('Initializing WASM...');
    
    // Initialize WASM for Node.js
    try {
        // @ts-ignore
        const wasmBindings = await import('../dist/wasm/charms_lib_bg.js');
        const wasmPath = path.join(__dirname, '../src/wasm/charms_lib_bg.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        
        const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
            './charms_lib_bg.js': wasmBindings
        });
        
        (wasmBindings as any).__wbg_set_wasm(wasmModule.instance.exports);
        initializeWasm(wasmBindings);
        console.log('✅ WASM initialized');
    } catch (error) {
        console.log('❌ WASM initialization failed:', error);
        return;
    }
    
    for (const txId of TESTNET4_TRANSACTIONS) {
        
        try {
            // Fetch transaction hex from testnet4
            const response = await fetch(`https://mempool.space/testnet4/api/tx/${txId}/hex`);
            if (!response.ok) {
                continue;
            }
            
            const txHex = await response.text();
            
            // Create wallet outpoints (simulate wallet owns outputs 0 and 1)
            const walletOutpoints = new Set([`${txId}:0`, `${txId}:1`]);
            
            // Extract charms using official function
            const charms = await extractCharmsForWallet(txHex, txId, walletOutpoints, 'testnet4');
            
            console.log(`\n=== Transaction ${txId} ===`);
            if (charms.length > 0) {
                console.log(`Found ${charms.length} charm(s):`);
                console.log(JSON.stringify(charms, null, 2));
            } else {
                console.log('No charms found');
            }
            
        } catch (error) {
            console.log(`Error processing ${txId}:`, error);
        }
    }
}

testnet4Demo().catch(() => {});

/**
 * Test for transaction 3c83865a...
 * Extract all charms and show output details
 * Using BROWSER version to match wallet behavior
 */

import { extractAndVerifySpell } from '../dist/browser.js';
import { initializeWasm } from '../dist/node.js';

const TX_ID = '3c83865addfc9ff49e06f997c1bf50ba241c191182974ad9dae9ea70fc8a2dc6';

async function initWasm() {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // @ts-ignore
    const wasmBindings = await import('../dist/wasm/charms_lib_bg.js') as any;
    const wasmPath = join(__dirname, '../dist/wasm/charms_lib_bg.wasm');
    const wasmBuffer = readFileSync(wasmPath);
    
    const imports = {
        './charms_lib_bg.js': wasmBindings
    };
    
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, imports);
    wasmBindings.__wbg_set_wasm(wasmModule.instance.exports);
    
    initializeWasm(wasmBindings);
}

async function testTx() {
    console.log('='.repeat(80));
    console.log('Testing TX:', TX_ID);
    console.log('='.repeat(80));
    console.log();
    
    // Fetch transaction hex
    const response = await fetch(`https://mempool.space/api/tx/${TX_ID}/hex`);
    const txHex = await response.text();
    
    // Initialize WASM
    await initWasm();
    
    // Extract charms (browser version - txId will be calculated internally)
    console.log('Using browser version of extractAndVerifySpell');
    const result = await extractAndVerifySpell(txHex, 'mainnet');
    
    console.log('Result txIds:', result.charms.map(c => c.txid));
    console.log('Expected txId:', TX_ID);
    console.log();
    
    if (!result.success) {
        console.error('❌ Extraction failed:', result.error);
        return;
    }
    
    console.log(`✅ Found ${result.charms.length} charm(s) in this transaction\n`);
    
    // Show detailed information for each charm
    for (let i = 0; i < result.charms.length; i++) {
        const charm = result.charms[i];
        console.log(`${'─'.repeat(80)}`);
        console.log(`Charm #${i + 1}:`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`  Output Index:    ${charm.outputIndex}`);
        console.log(`  Address:         ${charm.address}`);
        console.log(`  Amount:          ${charm.amount} sats`);
        console.log(`  Version:         ${charm.version}`);
        console.log(`  App ID:          ${charm.appId}`);
        
        // Show spell outputs if available
        if (charm.app && charm.app.outputs) {
            console.log(`  Spell Outputs:   ${charm.app.outputs.length}`);
            console.log(`  Spell Details:`);
            charm.app.outputs.forEach((output: any, idx: number) => {
                console.log(`    Output ${idx}:`);
                console.log(`      Amount: ${output.amount} sats`);
                if (output.address) {
                    console.log(`      Address: ${output.address}`);
                }
            });
        }
        
        // Show metadata if available
        if (charm.metadata && Object.keys(charm.metadata).length > 0) {
            console.log(`  Metadata:`);
            if (charm.metadata.ticker) console.log(`    Ticker: ${charm.metadata.ticker}`);
            if (charm.metadata.name) console.log(`    Name: ${charm.metadata.name}`);
            if (charm.metadata.description) console.log(`    Description: ${charm.metadata.description}`);
        }
        
        console.log();
    }
    
    console.log(`${'='.repeat(80)}`);
    console.log('Summary:');
    console.log(`${'='.repeat(80)}`);
    console.log(`Total charms found: ${result.charms.length}`);
    console.log(`Output indices with charms: ${result.charms.map(c => c.outputIndex).join(', ')}`);
    console.log(`Total charm value: ${result.charms.reduce((sum, c) => sum + c.amount, 0)} sats`);
    console.log();
}

testTx().catch(console.error);

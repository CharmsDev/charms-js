/**
 * Node.js Example - How to use charms-js in Node.js environment
 * 
 * This example shows how to:
 * 1. Initialize the WASM module
 * 2. Extract charms from a Bitcoin transaction
 * 3. Handle the results
 */

import { initializeWasm, extractAndVerifySpell, fetchTransactionHex } from '../../dist/node.js';

// Example transaction ID (mainnet)
const TX_ID = '3c83865addfc9ff49e06f997c1bf50ba241c191182974ad9dae9ea70fc8a2dc6';

async function main() {
    console.log('='.repeat(80));
    console.log('Charms-JS Node.js Example');
    console.log('='.repeat(80));
    console.log();

    try {
        // Step 1: Initialize WASM (required for Node.js)
        console.log('1. Initializing WASM module...');
        const { readFileSync } = await import('fs');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        // @ts-ignore
        const wasmBindings = await import('../../dist/wasm/charms_lib_bg.js') as any;
        const wasmPath = join(__dirname, '../../dist/wasm/charms_lib_bg.wasm');
        const wasmBuffer = readFileSync(wasmPath);
        
        const imports = {
            './charms_lib_bg.js': wasmBindings
        };
        
        const wasmModule = await WebAssembly.instantiate(wasmBuffer, imports);
        wasmBindings.__wbg_set_wasm(wasmModule.instance.exports);
        
        initializeWasm(wasmBindings);
        console.log('✅ WASM initialized\n');

        // Step 2: Fetch transaction hex
        console.log('2. Fetching transaction hex...');
        const txHex = await fetchTransactionHex(TX_ID, { network: 'mainnet' });
        
        if (!txHex) {
            console.error('❌ Failed to fetch transaction');
            return;
        }
        console.log(`✅ Transaction fetched (${txHex.length} chars)\n`);

        // Step 3: Extract and verify charms
        console.log('3. Extracting charms...');
        const result = await extractAndVerifySpell(txHex, 'mainnet');

        if (!result.success) {
            console.error('❌ Extraction failed:', result.error);
            return;
        }

        console.log(`✅ Found ${result.charms.length} charm(s)\n`);

        // Step 4: Display results
        console.log('='.repeat(80));
        console.log('Results:');
        console.log('='.repeat(80));
        
        result.charms.forEach((charm, index) => {
            console.log(`\nCharm #${index + 1}:`);
            console.log(`  TX ID: ${charm.txid}`);
            console.log(`  Output Index: ${charm.outputIndex}`);
            console.log(`  Address: ${charm.address}`);
            console.log(`  Amount: ${charm.amount} sats`);
            console.log(`  App ID: ${charm.appId}`);
            console.log(`  Version: ${charm.version}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ Example completed successfully');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();

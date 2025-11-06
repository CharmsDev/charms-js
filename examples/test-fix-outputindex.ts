/**
 * Test for outputIndex and address fix
 * Transaction: 0e5bfa19a4ee21d0c3e9bd68055c77f1106cc9e6bebf1448df9bb862f02d9668
 * 
 * Expected results based on mempool.space:
 * - Output 0: bc1pu72a3mv9pv5f7a0lqdtwcq3m59zvjy7uawtnmxnrtjl0h0fuvyjsxpmcnz (330 sats) - outputIndex: 0
 * - Output 1: bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk (330 sats) - outputIndex: 1
 * 
 * This transaction has charms in outputs 0 and 1 according to the spell data
 */

import { extractAndVerifySpell, initializeWasm } from '../dist/node.js';

const TX_ID = '0e5bfa19a4ee21d0c3e9bd68055c77f1106cc9e6bebf1448df9bb862f02d9668';

// Expected addresses from mempool.space
const EXPECTED_ADDRESSES = {
    0: 'bc1pu72a3mv9pv5f7a0lqdtwcq3m59zvjy7uawtnmxnrtjl0h0fuvyjsxpmcnz',
    1: 'bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk'
};

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

async function testOutputIndexAndAddress() {
    console.log('='.repeat(80));
    console.log('Testing outputIndex and address fix');
    console.log('Transaction:', TX_ID);
    console.log('='.repeat(80));
    console.log();
    
    // Fetch transaction hex
    console.log('Fetching transaction hex from mempool.space...');
    let txHex: string;
    try {
        const response = await fetch(`https://mempool.space/api/tx/${TX_ID}/hex`);
        if (!response.ok) {
            console.error('❌ Failed to fetch transaction hex');
            return;
        }
        txHex = await response.text();
        console.log(`✅ Fetched transaction hex (${txHex.length} chars)\n`);
    } catch (error) {
        console.error('❌ Error fetching transaction:', error);
        return;
    }
    
    // Initialize WASM
    try {
        await initWasm();
        console.log('✅ WASM initialized');
    } catch (error) {
        console.error('❌ Failed to initialize WASM:', error);
        return;
    }
    
    // Extract charms
    try {
        const result = await extractAndVerifySpell(txHex, 'mainnet');
        
        if (!result.success) {
            console.error('❌ Extraction failed:', result.error);
            return;
        }
        
        console.log(`\n✅ Extraction successful: Found ${result.charms.length} charm(s)\n`);
        
        // Validate each charm
        let allTestsPassed = true;
        
        for (let i = 0; i < result.charms.length; i++) {
            const charm = result.charms[i];
            console.log(`Charm ${i + 1}:`);
            console.log(`  appId: ${charm.appId}`);
            console.log(`  amount: ${charm.amount}`);
            console.log(`  outputIndex: ${charm.outputIndex}`);
            console.log(`  address: ${charm.address}`);
            console.log(`  txid: ${charm.txid}`);
            
            // Validate outputIndex
            if (charm.outputIndex === undefined || charm.outputIndex === null) {
                console.log(`  ❌ FAIL: outputIndex is undefined/null`);
                allTestsPassed = false;
            } else if (charm.outputIndex < 0 || charm.outputIndex >= 4) {
                console.log(`  ❌ FAIL: outputIndex ${charm.outputIndex} is out of range (should be 0-3)`);
                allTestsPassed = false;
            } else {
                console.log(`  ✅ PASS: outputIndex is valid (${charm.outputIndex})`);
            }
            
            // Validate address
            const expectedAddress = EXPECTED_ADDRESSES[charm.outputIndex as keyof typeof EXPECTED_ADDRESSES];
            if (!charm.address || charm.address.length === 0) {
                console.log(`  ❌ FAIL: address is empty`);
                allTestsPassed = false;
            } else if (charm.address.length > 62 || charm.address.length < 42) {
                console.log(`  ❌ FAIL: address length ${charm.address.length} is invalid (should be 42-62 chars)`);
                allTestsPassed = false;
            } else if (!charm.address.startsWith('bc1')) {
                console.log(`  ❌ FAIL: address doesn't start with 'bc1' (mainnet)`);
                allTestsPassed = false;
            } else {
                console.log(`  ✅ PASS: address is valid format (${charm.address.length} chars)`);
                
                // Check if it matches expected address
                if (expectedAddress && charm.address === expectedAddress) {
                    console.log(`  ✅ PASS: address matches expected value`);
                } else if (expectedAddress) {
                    console.log(`  ⚠️  WARNING: address doesn't match expected`);
                    console.log(`     Expected: ${expectedAddress}`);
                    console.log(`     Got:      ${charm.address}`);
                }
            }
            
            // Validate txid
            if (charm.txid === TX_ID) {
                console.log(`  ✅ PASS: txid matches`);
            } else {
                console.log(`  ❌ FAIL: txid doesn't match`);
                allTestsPassed = false;
            }
            
            console.log();
        }
        
        // Summary
        console.log('='.repeat(80));
        if (allTestsPassed) {
            console.log('✅ ALL TESTS PASSED');
        } else {
            console.log('❌ SOME TESTS FAILED');
        }
        console.log('='.repeat(80));
        
        // Print full JSON for inspection
        console.log('\nFull charm data:');
        console.log(JSON.stringify(result.charms, null, 2));
        
    } catch (error) {
        console.error('❌ Error during extraction:', error);
    }
}

// Run the test
testOutputIndexAndAddress().catch(console.error);

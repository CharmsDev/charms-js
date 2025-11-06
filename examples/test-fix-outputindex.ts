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
    console.log('TESTING MULTI-CHARM TRANSACTION');
    console.log('='.repeat(80));
    console.log();
    
    // Fetch transaction details
    console.log('📡 Fetching transaction details from mempool.space...');
    let txDetails: any;
    let txHex: string;
    
    try {
        const detailsResponse = await fetch(`https://mempool.space/api/tx/${TX_ID}`);
        if (!detailsResponse.ok) {
            console.error('❌ Failed to fetch transaction details');
            return;
        }
        txDetails = await detailsResponse.json();
        
        const hexResponse = await fetch(`https://mempool.space/api/tx/${TX_ID}/hex`);
        if (!hexResponse.ok) {
            console.error('❌ Failed to fetch transaction hex');
            return;
        }
        txHex = await hexResponse.text();
        
        console.log('✅ Transaction data fetched\n');
    } catch (error) {
        console.error('❌ Error fetching transaction:', error);
        return;
    }
    
    // Display transaction info
    console.log('📋 TRANSACTION INFORMATION');
    console.log('-'.repeat(80));
    console.log('TXID:', TX_ID);
    console.log('Block Height:', txDetails.status.block_height);
    console.log('Confirmed:', txDetails.status.confirmed ? 'Yes' : 'No');
    console.log('Size:', txDetails.size, 'bytes');
    console.log('Fee:', txDetails.fee, 'sats');
    console.log();
    
    // Display inputs
    console.log('📥 INPUTS (' + txDetails.vin.length + ' total):');
    console.log('-'.repeat(80));
    txDetails.vin.forEach((input: any, index: number) => {
        console.log(`Input ${index}:`);
        console.log(`  Previous TXID: ${input.txid.substring(0, 16)}...`);
        console.log(`  Previous Output: ${input.vout}`);
        console.log(`  Address: ${input.prevout.scriptpubkey_address}`);
        console.log(`  Amount: ${input.prevout.value} sats`);
        console.log();
    });
    
    // Display outputs
    console.log('📤 OUTPUTS (' + txDetails.vout.length + ' total):');
    console.log('-'.repeat(80));
    txDetails.vout.forEach((output: any, index: number) => {
        console.log(`Output ${index}:`);
        console.log(`  Address: ${output.scriptpubkey_address}`);
        console.log(`  Amount: ${output.value} sats`);
        console.log(`  Type: ${output.scriptpubkey_type}`);
        console.log();
    });
    
    console.log('='.repeat(80));
    console.log('🔍 EXTRACTING CHARMS FROM TRANSACTION');
    console.log('='.repeat(80));
    console.log();
    
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
        
        console.log(`✅ Extraction successful: Found ${result.charms.length} charm(s)\n`);
        
        console.log('💎 EXTRACTED CHARMS:');
        console.log('-'.repeat(80));
        
        // Validate each charm
        let allTestsPassed = true;
        
        for (let i = 0; i < result.charms.length; i++) {
            const charm = result.charms[i];
            const outputInfo = txDetails.vout[charm.outputIndex];
            
            console.log(`\nCharm ${i + 1}:`);
            console.log(`  📍 Output Index: ${charm.outputIndex}`);
            console.log(`  💰 Charm Amount: ${charm.amount} sats (${(charm.amount / 100000000).toFixed(8)} BTC)`);
            console.log(`  📦 UTXO Amount: ${outputInfo.value} sats`);
            console.log(`  🏠 Address: ${charm.address}`);
            console.log(`  🔗 TXID: ${charm.txid}`);
            console.log(`  🆔 App ID: ${charm.appId.substring(0, 50)}...`);
            
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
            console.log(`\n  🔍 Validation:`);
            const expectedAddress = EXPECTED_ADDRESSES[charm.outputIndex as keyof typeof EXPECTED_ADDRESSES];
            const actualOutputAddress = outputInfo.scriptpubkey_address;
            
            if (!charm.address || charm.address.length === 0) {
                console.log(`     ❌ FAIL: address is empty`);
                allTestsPassed = false;
            } else if (charm.address.length > 62 || charm.address.length < 42) {
                console.log(`     ❌ FAIL: address length ${charm.address.length} is invalid (should be 42-62 chars)`);
                allTestsPassed = false;
            } else if (!charm.address.startsWith('bc1')) {
                console.log(`     ❌ FAIL: address doesn't start with 'bc1' (mainnet)`);
                allTestsPassed = false;
            } else {
                console.log(`     ✅ PASS: address is valid format (${charm.address.length} chars)`);
                
                // Check if it matches the actual output address
                if (charm.address === actualOutputAddress) {
                    console.log(`     ✅ PASS: address matches output ${charm.outputIndex} address from blockchain`);
                } else {
                    console.log(`     ❌ FAIL: address doesn't match output ${charm.outputIndex}`);
                    console.log(`        Expected: ${actualOutputAddress}`);
                    console.log(`        Got:      ${charm.address}`);
                    allTestsPassed = false;
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

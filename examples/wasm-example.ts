/**
 * Example showing WASM integration with Charms.js
 * This demonstrates how to use the hybrid API that prefers WASM when available
 */

import { decodeTransactionHybrid, initializeWasm, isWasmAvailable, getWasmInfo } from '../src/index';

// Test transaction IDs (same as current example)
const testTransactions = [
    '1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c',
    '86081de981f11ba05701dd20be846897b6154d510abef824895c7a8282f131a9',
    '1a34811c66f4dfd9953c02c95d33d96f775870ac8a111c43ca6ab17d3f3a4528'
];

async function testWasmIntegration() {
    console.log('=== Charms JS WASM Integration Test ===\n');
    
    // Check WASM availability
    console.log('🔍 WASM Status:');
    console.log('Available:', isWasmAvailable());
    console.log('Info:', getWasmInfo());
    console.log('');
    
    // If WASM is not available, show how to initialize it
    if (!isWasmAvailable()) {
        console.log('⚠️  WASM not initialized. To use WASM:');
        console.log('1. Import your WASM module');
        console.log('2. Call initializeWasm(wasmModule)');
        console.log('3. The hybrid API will automatically use WASM when available\n');
        
        console.log('📦 Proceeding with current CBOR implementation...\n');
    }
    
    // Test each transaction
    for (const txId of testTransactions) {
        console.log(`=== Testing Transaction: ${txId} ===`);
        
        try {
            // Fetch transaction hex
            const response = await fetch(`https://mempool.space/testnet4/api/tx/${txId}/hex`);
            if (!response.ok) {
                console.log(`   ❌ Failed to fetch transaction: ${response.status}`);
                continue;
            }
            
            const txHex = await response.text();
            console.log(`   📥 Transaction hex length: ${txHex.length}`);
            
            // Use hybrid API - will use WASM if available, fallback to CBOR
            const charms = await decodeTransactionHybrid(txHex, 'testnet4');
            
            if (charms.length === 0) {
                console.log('   ℹ️  No charms found in this transaction');
            } else {
                console.log(`   ✅ Found ${charms.length} charm(s):`);
                charms.forEach((charm, index) => {
                    console.log(`      Charm ${index + 1}:`);
                    console.log(`        UTXO: ${charm.utxo.tx}:${charm.utxo.index}`);
                    console.log(`        App ID: ${charm.appId}`);
                    console.log(`        Value: ${charm.value} sats`);
                    console.log(`        App Data: ${JSON.stringify(charm.app)}`);
                    console.log(`        Verified: ${charm.verified || false}`);
                });
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        console.log('');
    }
    
    console.log('=== Test Complete ===');
    
    // Show comparison with baseline if WASM was used
    if (isWasmAvailable()) {
        console.log('\n🔬 WASM Integration Summary:');
        console.log('- WASM module successfully integrated');
        console.log('- Spell extraction and verification handled by WASM');
        console.log('- No manual CBOR parsing required');
        console.log('- Automatic fallback to current implementation if WASM fails');
    } else {
        console.log('\n📋 Current Implementation Summary:');
        console.log('- Using existing CBOR parsing and spell extraction');
        console.log('- Manual app_public_inputs decoding');
        console.log('- To enable WASM, call initializeWasm() with your WASM module');
    }
}

// Example of how to initialize WASM (commented out since we don't have it loaded in Node.js)
/*
async function initializeWasmExample() {
    try {
        // In a browser or Node.js environment with proper WASM loading:
        const wasmModule = await import('./wasm/charms_lib.js');
        initializeWasm(wasmModule);
        console.log('✅ WASM initialized successfully');
    } catch (error) {
        console.log('❌ Failed to initialize WASM:', error.message);
    }
}
*/

testWasmIntegration().catch(console.error);

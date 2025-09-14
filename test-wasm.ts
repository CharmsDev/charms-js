/**
 * Test WASM output structure using TypeScript
 */

import { extractAndVerifySpell } from './src/wasm-wrapper';

async function testWasm() {
    try {
        // Use one of our test transaction IDs
        const txId = '1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c';
        
        console.log('Fetching transaction hex...');
        const response = await fetch(`https://mempool.space/testnet4/api/tx/${txId}/hex`);
        const txHex = await response.text();
        
        console.log('Transaction hex length:', txHex.length);
        console.log('Calling WASM extractAndVerifySpell...');
        
        const result = await extractAndVerifySpell(txHex, false);
        
        console.log('\n=== WASM RESULT ===');
        console.log(JSON.stringify(result, (key, value) => {
            // Convert Maps to objects for better JSON display
            if (value instanceof Map) {
                const obj: any = {};
                for (const [k, v] of value.entries()) {
                    obj[k] = v;
                }
                return obj;
            }
            return value;
        }, 2));
        
        console.log('\n=== RESULT ANALYSIS ===');
        console.log('Type:', typeof result);
        console.log('Has app_public_inputs:', !!result?.app_public_inputs);
        console.log('app_public_inputs type:', typeof result?.app_public_inputs);
        console.log('app_public_inputs instanceof Map:', result?.app_public_inputs instanceof Map);
        console.log('Has tx:', !!result?.tx);
        console.log('tx.outs length:', result?.tx?.outs?.length);
        
        if (result?.app_public_inputs instanceof Map) {
            console.log('Map size:', result.app_public_inputs.size);
            console.log('Map keys:', Array.from(result.app_public_inputs.keys()));
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWasm();

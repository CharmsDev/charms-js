/**
 * Quick test to see WASM output structure
 */

const { extractAndVerifySpell } = require('./dist/wasm-wrapper.js');

async function testWasm() {
    try {
        // Use one of our test transaction IDs
        const txId = '1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c';
        
        // Fetch transaction hex
        const response = await fetch(`https://mempool.space/testnet4/api/tx/${txId}/hex`);
        const txHex = await response.text();
        
        console.log('Transaction hex length:', txHex.length);
        console.log('Calling WASM extractAndVerifySpell...');
        
        const result = await extractAndVerifySpell(txHex, false);
        
        console.log('WASM result:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWasm();

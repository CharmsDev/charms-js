import { decodeTransaction, hasCharmsData, decodeTransactionById } from '../src/index';
import { extractSpellData } from '../src/extractor';
import { decodeCbor } from '../src/decoder';
import { BitcoinNetwork } from '../src/types';

// Test transaction IDs to fetch and decode
const testTxIds = [
    '1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c',
    '86081de981f11ba05701dd20be846897b6154d510abef824895c7a8282f131a9',
    '1a34811c66f4dfd9953c02c95d33d96f775870ac8a111c43ca6ab17d3f3a4528' // New test transaction with charm
];

// Function to test a single transaction using the new API
async function testTransactionById(txId: string, network?: BitcoinNetwork) {
    const networkLabel = network || 'default (testnet4)';
    console.log(`\n=== Testing Transaction: ${txId} (${networkLabel}) ===`);
    
    console.log('Fetching and decoding transaction...');
    const result = await decodeTransactionById(txId, network ? { network } : undefined);
    
    if ('error' in result) {
        console.log(`   Error: ${result.error}`);
    } else {
        console.log('   Success! Decoded Charms:');
        console.log(JSON.stringify(result, null, 4));
        console.log(`\n   Found ${result.length} charm(s) in this transaction.`);
        
        // Show spell version if available
        if (result.length > 0) {
            console.log(`   Transaction ID: ${result[0].utxo.tx}`);
        }
    }
}

// Function to test transaction using hex (legacy method)
async function testTransactionWithHex(txId: string, network?: BitcoinNetwork) {
    const networkLabel = network || 'default (testnet4)';
    console.log(`\n=== Testing Transaction with Hex: ${txId} (${networkLabel}) ===`);
    
    // First get the hex using our fetch function
    const { fetchTransactionHex } = await import('../src/index');
    const transactionHex = await fetchTransactionHex(txId, network ? { network } : undefined);
    
    if (!transactionHex) {
        console.log('   Failed to fetch transaction hex');
        return;
    }
    
    console.log('   Transaction hex fetched successfully');
    
    // Check if the transaction contains Charms data
    console.log('   Checking if transaction contains Charms data...');
    const containsCharms = hasCharmsData(transactionHex);
    console.log(`   Contains Charms data: ${containsCharms}`);

    if (containsCharms) {
        // Extract spell version
        console.log('   Extracting spell version...');
        try {
            const spellData = extractSpellData(transactionHex);
            if (spellData) {
                const normalizedSpell = decodeCbor(spellData);
                if (normalizedSpell) {
                    console.log(`   Spell version: ${normalizedSpell.version}`);

                    // Decode transaction
                    console.log('   Decoding transaction...');
                    const charms = await decodeTransaction(transactionHex);

                    if ('error' in charms) {
                        console.log(`   Error: ${charms.error}`);
                    } else {
                        console.log('   Decoded Charms:');
                        console.log(JSON.stringify(charms, null, 4));
                        console.log(`\n   Found ${charms.length} charm(s) in this transaction.`);
                    }
                } else {
                    console.log('   Error: Could not decode CBOR data');
                }
            } else {
                console.log('   Error: Could not extract spell data');
            }
        } catch (error) {
            console.log(`   Error: ${(error as Error).message}`);
        }
    } else {
        console.log('   No Charms data found in this transaction.');
    }
}


async function runExample() {
    console.log('=== Charms JS Network Testing Example ===\n');
    
    console.log('Testing with new decodeTransactionById API:\n');
    
    // Test 1: Default network behavior (should use testnet4)
    console.log('🔸 Test 1: Default network behavior');
    for (const txId of testTxIds) {
        await testTransactionById(txId);
    }
    
    // Test 2: Explicit testnet4
    console.log('\n\n🔸 Test 2: Explicit testnet4 network');
    for (const txId of testTxIds) {
        await testTransactionById(txId, 'testnet4');
    }
    
    // Test 3: Mainnet (should fail as these transactions don't exist there)
    console.log('\n\n🔸 Test 3: Mainnet network (expecting failures)');
    for (const txId of testTxIds) {
        await testTransactionById(txId, 'mainnet');
    }
    
    // Test 4: Legacy hex-based method for comparison
    console.log('\n\n🔸 Test 4: Legacy hex-based method (testnet4)');
    await testTransactionWithHex(testTxIds[1]); // Test with the version 6 transaction
}

// Run the example
runExample().catch(console.error);

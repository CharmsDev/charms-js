/**
 * Test txId calculation
 */

import * as bitcoin from 'bitcoinjs-lib';

const TX_ID = '3c83865addfc9ff49e06f997c1bf50ba241c191182974ad9dae9ea70fc8a2dc6';

async function testTxIdCalculation() {
    console.log('Expected TX_ID:', TX_ID);
    console.log();
    
    // Fetch transaction hex
    const response = await fetch(`https://mempool.space/api/tx/${TX_ID}/hex`);
    const txHex = await response.text();
    
    console.log('TX Hex length:', txHex.length);
    console.log();
    
    // Calculate using bitcoinjs-lib
    const tx = bitcoin.Transaction.fromHex(txHex);
    const calculatedTxId = tx.getId();
    
    console.log('Calculated TX_ID (bitcoinjs):', calculatedTxId);
    console.log('Match:', calculatedTxId === TX_ID);
    console.log();
    
    // Try manual calculation (browser way - WRONG)
    const txBytes = new Uint8Array(txHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const hash1 = await crypto.subtle.digest('SHA-256', txBytes);
    const hash2 = await crypto.subtle.digest('SHA-256', hash1);
    const hashArray = new Uint8Array(hash2);
    const reversedHash = Array.from(hashArray).reverse();
    const wrongTxId = reversedHash.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Wrong TX_ID (browser calc):', wrongTxId);
    console.log('Match:', wrongTxId === TX_ID);
    console.log();
    
    // The issue: SegWit transactions have witness data
    // The txId should be calculated from the transaction WITHOUT witness data
    console.log('Transaction has witness:', tx.hasWitnesses());
    
    // Get the transaction without witness data
    // @ts-ignore - bitcoinjs-lib types
    const txNoWitnessBuffer = tx.toBuffer(false, undefined); // false = no witness
    const txNoWitness = new Uint8Array(txNoWitnessBuffer);
    const hash1NoWit = await crypto.subtle.digest('SHA-256', txNoWitness);
    const hash2NoWit = await crypto.subtle.digest('SHA-256', hash1NoWit);
    const hashArrayNoWit = new Uint8Array(hash2NoWit);
    const reversedHashNoWit = Array.from(hashArrayNoWit).reverse();
    const correctTxId = reversedHashNoWit.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Correct TX_ID (no witness):', correctTxId);
    console.log('Match:', correctTxId === TX_ID);
}

testTxIdCalculation().catch(console.error);

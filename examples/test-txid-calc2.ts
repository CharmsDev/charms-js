/**
 * Test txId calculation - deeper investigation
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as crypto from 'crypto';

const TX_ID = '3c83865addfc9ff49e06f997c1bf50ba241c191182974ad9dae9ea70fc8a2dc6';

async function testTxIdCalculation() {
    console.log('Expected TX_ID:', TX_ID);
    console.log();
    
    // Fetch transaction hex
    const response = await fetch(`https://mempool.space/api/tx/${TX_ID}/hex`);
    const txHex = await response.text();
    
    console.log('TX Hex (first 100 chars):', txHex.substring(0, 100));
    console.log('TX Hex length:', txHex.length);
    console.log();
    
    // Calculate using bitcoinjs-lib
    const tx = bitcoin.Transaction.fromHex(txHex);
    const calculatedTxId = tx.getId();
    
    console.log('Calculated TX_ID (bitcoinjs):', calculatedTxId);
    console.log('Match:', calculatedTxId === TX_ID);
    console.log();
    
    // Check witness flag
    console.log('Has witnesses:', tx.hasWitnesses());
    console.log();
    
    // Try to understand the transaction structure
    // SegWit transactions have a marker (0x00) and flag (0x01) after version
    const txBytes = Buffer.from(txHex, 'hex');
    console.log('First 10 bytes:', txBytes.subarray(0, 10).toString('hex'));
    
    // Version (4 bytes) + marker (1 byte) + flag (1 byte)
    const version = txBytes.readUInt32LE(0);
    console.log('Version:', version);
    
    const marker = txBytes[4];
    const flag = txBytes[5];
    console.log('Marker:', marker.toString(16), '(should be 00 for SegWit)');
    console.log('Flag:', flag.toString(16), '(should be 01 for SegWit)');
    console.log();
    
    // For SegWit, txId is calculated from the transaction WITHOUT the marker, flag, and witness data
    // We need to reconstruct the legacy format
    
    // Use Node's crypto for double SHA256
    const hash1 = crypto.createHash('sha256').update(txBytes).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const wrongTxId = hash2.reverse().toString('hex');
    
    console.log('Wrong TX_ID (full hex):', wrongTxId);
    console.log();
    
    // The correct way: bitcoinjs-lib internally handles SegWit properly
    // Let's see what __toBuffer does
    // @ts-ignore - accessing private method for debugging
    const legacyBuffer = tx.__toBuffer(undefined, undefined, false);
    const hash1Legacy = crypto.createHash('sha256').update(legacyBuffer).digest();
    const hash2Legacy = crypto.createHash('sha256').update(hash1Legacy).digest();
    const correctTxId = hash2Legacy.reverse().toString('hex');
    
    console.log('Correct TX_ID (legacy format):', correctTxId);
    console.log('Match:', correctTxId === TX_ID);
}

testTxIdCalculation().catch(console.error);

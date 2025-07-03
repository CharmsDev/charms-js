import * as bitcoin from 'bitcoinjs-lib';
import { extractSpellData } from './extractor';
import { decodeCbor, denormalizeSpell } from './decoder';
import { createCharmInstances } from './formatter';
import { CharmInstance, ErrorResponse } from './types';
import { extractAndVerifySpell } from './verification';
import { extractAddress } from './address';

// Decodes Bitcoin transaction containing Charms data with verification
export async function decodeTransaction(txHex: string): Promise<CharmInstance[] | ErrorResponse> {
  try {
    const spellData = extractSpellData(txHex);
    if (!spellData) {
      return { error: 'No spell data found in transaction' };
    }

    const normalizedSpell = decodeCbor(spellData);
    if (!normalizedSpell) {
      return { error: 'Failed to decode CBOR data' };
    }

    const charmInfo = denormalizeSpell(normalizedSpell);

    // Perform verification with provided spellVk
    const verifiedSpell = await extractAndVerifySpell(txHex);
    charmInfo.verified = verifiedSpell ? verifiedSpell.verified : false;

    const tx = bitcoin.Transaction.fromHex(txHex);
    const txId = tx.getId();

    // Add transaction inputs if missing from CBOR
    if (charmInfo.ins.length === 0) {
      tx.ins.forEach((input) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        charmInfo.ins.push({ utxo_id: `${txid}:${input.index}` });
      });
    }

    // Extract addresses from outputs using helper
    tx.outs.forEach((output, index) => {
      if (charmInfo.outs[index]) {
        charmInfo.outs[index].address = extractAddress(output.script);
      }
    });

    return createCharmInstances(charmInfo, txId);
  } catch (error) {
    return { error: `Decoding failed: ${(error as Error).message}` };
  }
}

// Checks if transaction contains Charms data
export function hasCharmsData(txHex: string): boolean {
  try {
    const spellData = extractSpellData(txHex);
    return spellData !== null;
  } catch (error) {
    return false;
  }
}

export * from './types';
export * from './utils';
export * from './verification';

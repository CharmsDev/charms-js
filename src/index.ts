import * as bitcoin from 'bitcoinjs-lib';
import { extractSpellData } from './extractor';
import { decodeCbor, denormalizeSpell } from './decoder';
import { createCharmInstances } from './formatter';
import { CharmInstance, ErrorResponse, NormalizedSpell, BitcoinNetwork, NetworkConfig } from './types';
import { extractAddress } from './address';

// Add transaction inputs to spell
function addTransactionInputs(spell: NormalizedSpell, tx: bitcoin.Transaction): NormalizedSpell {
  // Validate spell structure
  if (spell.tx.ins !== undefined && spell.tx.ins !== null) {
    throw new Error("spell must inherit inputs from the enchanted tx");
  }

  if (spell.tx.outs.length > tx.outs.length) {
    throw new Error("spell tx outs mismatch");
  }

  // Add transaction inputs (excluding the spell input which is last)
  const txIns = tx.ins.slice(0, -1);
  const utxoIds = txIns.map(txIn => {
    const txid = Buffer.from(txIn.hash).reverse().toString('hex');
    return `${txid}:${txIn.index}`;
  });

  const spellWithInputs = { ...spell };
  spellWithInputs.tx = { ...spell.tx, ins: utxoIds };

  return spellWithInputs;
}

// Fetch transaction hex from API
export async function fetchTransactionHex(txId: string, config?: NetworkConfig): Promise<string | null> {
  const network = config?.network || 'testnet4';
  const baseUrl = config?.apiBaseUrl || (network === 'mainnet' 
    ? 'https://mempool.space/api/tx' 
    : 'https://mempool.space/testnet4/api/tx');
  
  try {
    const response = await fetch(`${baseUrl}/${txId}/hex`);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}

// Decodes Bitcoin transaction containing Charms data
export async function decodeTransaction(txHex: string, config?: NetworkConfig): Promise<CharmInstance[] | ErrorResponse> {
  try {
    const spellData = extractSpellData(txHex);
    if (!spellData) {
      return { error: 'No spell data found in transaction' };
    }

    const normalizedSpell = decodeCbor(spellData);
    if (!normalizedSpell) {
      return { error: 'Failed to decode CBOR data' };
    }

    // Validate version is not negative
    if (normalizedSpell.version < 0) {
      return { error: `Invalid spell version: ${normalizedSpell.version}. Version must be >= 0.` };
    }

    const tx = bitcoin.Transaction.fromHex(txHex);
    const spellWithInputs = addTransactionInputs(normalizedSpell, tx);
    const charmInfo = denormalizeSpell(spellWithInputs);

    const txId = tx.getId();

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

// Decode transaction by ID (fetches from API)
export async function decodeTransactionById(txId: string, config?: NetworkConfig): Promise<CharmInstance[] | ErrorResponse> {
  const txHex = await fetchTransactionHex(txId, config);
  if (!txHex) {
    return { error: `Failed to fetch transaction ${txId}` };
  }
  return decodeTransaction(txHex, config);
}

export * from './types';
export * from './utils';

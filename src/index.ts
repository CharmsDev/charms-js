import * as bitcoin from 'bitcoinjs-lib';
import { extractSpellData } from './extractor';
import { decodeCbor, denormalizeSpell } from './decoder';
import { formatDetailedCharms } from './formatter';
import { CharmSummary, DetailedCharm, ErrorResponse, isErrorResponse } from './types';
import { fromOutputScript } from 'bitcoinjs-lib/src/address';

// Decodes Bitcoin transaction containing Charms data
export function decodeTransaction(txHex: string): CharmSummary | ErrorResponse {
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
    return charmInfo;
  } catch (error) {
    return { error: `Decoding failed: ${(error as Error).message}` };
  }
}

// Decodes transaction and returns detailed charm information
export function decodeDetailedCharms(txHex: string): DetailedCharm[] | ErrorResponse {
  try {
    const charmInfo = decodeTransaction(txHex);
    if (isErrorResponse(charmInfo)) {
      return charmInfo;
    }

    const tx = bitcoin.Transaction.fromHex(txHex);
    const txId = tx.getId();

    // Extract inputs if not present in CBOR data
    if (charmInfo.ins.length === 0) {
      tx.ins.forEach((input, index) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        const vout = input.index;
        charmInfo.ins.push({
          utxo_id: `${txid}:${vout}`
        });
      });
    }

    // Extract addresses from transaction outputs
    tx.outs.forEach((output, index) => {
      try {
        let address = 'unknown';
        try {
          // Try testnet first
          try {
            address = fromOutputScript(output.script, bitcoin.networks.testnet);
          } catch (e1) {
            // Fallback to mainnet
            try {
              address = fromOutputScript(output.script, bitcoin.networks.bitcoin);
            } catch (e2) {
              // Manual decode for P2TR scripts
              const outputScript = bitcoin.script.decompile(output.script);
              if (outputScript && outputScript.length > 1) {
                if (outputScript[0] === bitcoin.opcodes.OP_1 &&
                  (outputScript[1] as Buffer).length === 32) {
                  const key = (outputScript[1] as Buffer).toString('hex');

                  try {
                    const data = Buffer.from(key, 'hex');
                    address = bitcoin.address.toBech32(data, 1, 'tb');
                  } catch (e3) {
                    try {
                      const data = Buffer.from(key, 'hex');
                      address = bitcoin.address.toBech32(data, 1, 'bc');
                    } catch (e4) {
                      console.log(`Error creating Taproot address: ${(e4 as Error).message}`);
                    }
                  }
                }
              }

              if (address === 'unknown') {
                console.log(`Error extracting address: ${(e2 as Error).message}`);
              }
            }
          }
        } catch (e) {
          console.log(`Error extracting address: ${(e as Error).message}`);
        }

        if (charmInfo.outs[index]) {
          charmInfo.outs[index].address = address;
        }
      } catch (e) {
        // Continue processing remaining outputs
      }
    });

    return formatDetailedCharms(charmInfo, txId);
  } catch (error) {
    return { error: `Detailed decoding failed: ${(error as Error).message}` };
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

// Returns empty result when no Charms data found
export function emptyCharmsResult(): CharmSummary {
  return {
    version: 0,
    apps: {},
    ins: [],
    outs: []
  };
}

export * from './types';
export * from './utils';

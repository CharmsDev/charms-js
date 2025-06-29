import { DecodedSpell, CharmSummary, NormalizedSpell, NormalizedCharms } from './types';
import * as cbor from 'cbor';

// Converts Maps to plain objects recursively
function convertMapsToObjects(obj: any): any {
  if (obj instanceof Map) {
    const result: any = {};
    for (const [key, value] of obj.entries()) {
      result[key] = convertMapsToObjects(value);
    }
    return result;
  } else if (Array.isArray(obj)) {
    return obj.map(item => convertMapsToObjects(item));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertMapsToObjects(value);
    }
    return result;
  }
  return obj;
}

// Decodes CBOR data extracted from transaction
export function decodeCbor(cborData: Buffer): NormalizedSpell | null {
  try {
    if (!cborData || cborData.length === 0) {
      return null;
    }

    const rawDecoded = cbor.decode(cborData);

    // Convert Maps to plain objects for JSON serialization
    const decoded = convertMapsToObjects(rawDecoded);

    console.log('Parsing spell data:', JSON.stringify(decoded, null, 2).substring(0, 200) + '...');

    // CBOR structure is [NormalizedSpell, Proof]
    if (!Array.isArray(decoded) || decoded.length < 2) {
      console.log('Invalid CBOR structure: expected [spell, proof] array');
      return null;
    }

    const normalizedSpell = decoded[0];

    // Validate NormalizedSpell structure
    if (normalizedSpell &&
      typeof normalizedSpell === 'object' &&
      'version' in normalizedSpell &&
      'tx' in normalizedSpell &&
      'app_public_inputs' in normalizedSpell) {

      return normalizedSpell as NormalizedSpell;
    }

    console.log('Invalid spell structure in CBOR data');
    return null;
  } catch (error) {
    console.log(`Error in decodeCbor: ${(error as Error).message}`);
    return null;
  }
}

// Denormalizes NormalizedSpell into human-readable format
export function denormalizeSpell(normalizedSpell: NormalizedSpell): CharmSummary {
  // Convert app_public_inputs to apps using $xxxx format
  const apps: Record<string, any> = {};
  const appKeys = Object.keys(normalizedSpell.app_public_inputs);
  appKeys.forEach((appKey, index) => {
    const indexKey = `$${String(index).padStart(4, '0')}`;
    apps[indexKey] = normalizedSpell.app_public_inputs[appKey];
  });

  const ins = normalizedSpell.tx.ins || [];

  // Process outputs and extract charms
  const outs = normalizedSpell.tx.outs.map((normalizedCharms: NormalizedCharms) => {
    const output: any = {};

    if (Object.keys(normalizedCharms).length > 0) {
      const charms: Record<string, any> = {};

      // Convert numeric app indices to $xxxx format
      Object.entries(normalizedCharms).forEach(([appIndexStr, charmData]) => {
        const appIndex = parseInt(appIndexStr);
        const indexKey = `$${String(appIndex).padStart(4, '0')}`;

        // Extract charm data value
        if (charmData && typeof charmData === 'object' && 'value' in charmData) {
          charms[indexKey] = charmData.value;
        } else {
          charms[indexKey] = charmData;
        }
      });

      if (Object.keys(charms).length > 0) {
        output.charms = charms;
      }
    }

    return output;
  });

  return {
    version: normalizedSpell.version,
    apps,
    ins: ins.map(utxoId => ({ utxo_id: utxoId })),
    outs
  };
}

import { ParsedCharmData, NormalizedSpell, NormalizedCharms } from './types';
import * as cbor from 'cbor';

// Converts CBOR Maps to plain objects recursively, with special handling for app_public_inputs
function convertMapsToObjects(obj: any, isAppPublicInputs: boolean = false): any {
  if (obj instanceof Map) {
    if (isAppPublicInputs) {
      // Special handling for app_public_inputs Map
      // Convert Map entries where key is ['t', hash1Array, hash2Array] to canonical string format
      const result: any = {};
      for (const [key, value] of obj.entries()) {
        if (Array.isArray(key) && key.length >= 3 && key[0] === 't') {
          // Convert the key from ['t', hash1Array, hash2Array] to 't/hash1/hash2'
          try {
            const hash1 = Buffer.from(key[1]).toString('hex');
            const hash2 = Buffer.from(key[2]).toString('hex');
            const canonicalKey = `t/${hash1}/${hash2}`;
            result[canonicalKey] = convertMapsToObjects(value, false);
          } catch (error) {
            // If conversion fails, use original key
            result[String(key)] = convertMapsToObjects(value, false);
          }
        } else {
          result[String(key)] = convertMapsToObjects(value, false);
        }
      }
      return result;
    } else {
      // Regular Map to object conversion
      const result: any = {};
      for (const [key, value] of obj.entries()) {
        result[key] = convertMapsToObjects(value, false);
      }
      return result;
    }
  } else if (Array.isArray(obj)) {
    return obj.map(item => convertMapsToObjects(item, false));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Special handling for app_public_inputs to properly decode Map structure
      if (key === 'app_public_inputs' && value instanceof Map) {
        result[key] = convertMapsToObjects(value, true);
      } else {
        result[key] = convertMapsToObjects(value, false);
      }
    }
    return result;
  }
  return obj;
}

// Decodes CBOR data from Bitcoin transaction
export function decodeCbor(cborData: Buffer): NormalizedSpell | null {
  try {
    if (!cborData || cborData.length === 0) {
      return null;
    }

    const rawDecoded = cbor.decode(cborData);
    
    // CBOR decoded successfully
    
    const decoded = convertMapsToObjects(rawDecoded);

    console.log('Parsing spell data:', JSON.stringify(decoded, null, 2).substring(0, 200) + '...');

    // CBOR structure: [NormalizedSpell, Proof]
    if (!Array.isArray(decoded) || decoded.length < 2) {
      console.log('Invalid CBOR structure: expected [spell, proof] array');
      return null;
    }

    const normalizedSpell = decoded[0];

    // Validate spell structure
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

// Converts NormalizedSpell to ParsedCharmData format
export function denormalizeSpell(normalizedSpell: NormalizedSpell): ParsedCharmData {
  // Handle app_public_inputs as Map or Object
  const apps: Record<string, any> = {};
  
  let appEntries: [string, any][] = [];
  if (normalizedSpell.app_public_inputs instanceof Map) {
    // If it's a Map, get entries directly
    appEntries = Array.from(normalizedSpell.app_public_inputs.entries());
  } else if (typeof normalizedSpell.app_public_inputs === 'object') {
    // If it's an object, convert to entries
    appEntries = Object.entries(normalizedSpell.app_public_inputs);
  }
  
  appEntries.forEach(([appKey, appData], index) => {
    const indexKey = `$${String(index).padStart(4, '0')}`;
    apps[indexKey] = {
      // Store the raw data internally for App ID reconstruction
      _app_public_inputs_raw: appKey,
      // Spread any additional app data (like action, etc.)
      ...(appData || {})
    };
  });

  const ins = normalizedSpell.tx.ins || [];

  // Extract charms from outputs
  const outs = normalizedSpell.tx.outs.map((normalizedCharms: NormalizedCharms) => {
    const output: any = {};

    if (Object.keys(normalizedCharms).length > 0) {
      const charms: Record<string, any> = {};

      // Convert numeric indices to $xxxx format
      Object.entries(normalizedCharms).forEach(([appIndexStr, charmData]) => {
        const appIndex = parseInt(appIndexStr);
        const indexKey = `$${String(appIndex).padStart(4, '0')}`;

        // Preserve original CBOR structure
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

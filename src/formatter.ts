import { ParsedCharmData, CharmInstance, ErrorResponse } from './types';
import { getAppType } from './utils';

/**
 * Attempts to reconstruct a canonical Charm APP ID from `app_public_inputs`.
 * This handles both cases: when appId is already decoded correctly, and when it needs reconstruction.
 *
 * @param appData - The app data object containing app_public_inputs.
 * @param appId - The original appId (could be $0000 or already decoded).
 * @returns The reconstructed APP ID, or the original `appId` if reconstruction fails.
 */
function reconstructAppId(appData: any, appId: string): string {
    // If we have a valid canonical appId already (from proper decoding), use it
    if (appId && appId !== '$0000' && appId.startsWith('t/') && appId.includes('/')) {
        return appId;
    }

    // Check if _app_public_inputs_raw contains the canonical app ID
    if (appData?._app_public_inputs_raw) {
        const rawInput = appData._app_public_inputs_raw;
        // If it's already in canonical format, return it
        if (typeof rawInput === 'string' && rawInput.startsWith('t/') && rawInput.includes('/')) {
            return rawInput;
        }
    }

    // Fallback: try to reconstruct from raw decimal data (legacy approach)
    const candidates: any[] = [
        appData?._app_public_inputs_raw,
        appData?.app_public_inputs,
        appData?.appPublicInputs,
        appData?.publicInputs,
        appData?.inputs
    ].filter(Boolean);

    // Helper to normalize various data structures into a string.
    const toStringCandidate = (src: any): string | null => {
        if (typeof src === 'string') return src;
        if (Array.isArray(src)) return src.join(',');
        if (typeof src === 'object') {
            for (const [k, v] of Object.entries(src)) {
                if (typeof v === 'string' && v.startsWith('t,')) return v;
                if (typeof k === 'string' && k.startsWith('t,')) return k;
            }
        }
        return null;
    };

    for (const candidate of candidates) {
        const inputStr = toStringCandidate(candidate);
        if (!inputStr || !inputStr.startsWith('t,')) continue;

        try {
            const parts = inputStr.split(',');
            // A valid App ID requires 't' plus 64 bytes for the two hashes.
            if (parts.length >= 65) {
                const hash1Bytes = parts.slice(1, 33).map(x => parseInt(x.trim(), 10));
                const hash1 = Buffer.from(hash1Bytes).toString('hex');
                const hash2Bytes = parts.slice(33, 65).map(x => parseInt(x.trim(), 10));
                const hash2 = Buffer.from(hash2Bytes).toString('hex');
                return `t/${hash1}/${hash2}`;
            }
        } catch (error) {
            // Ignore parsing errors and try the next candidate.
            continue;
        }
    }

    // Fallback to the original appId if reconstruction is not possible.
    return appId || '$0000';
}

// Converts parsed charm data to CharmInstance array with UTXO details
export function createCharmInstances(charmInfo: ParsedCharmData, txId: string): CharmInstance[] | ErrorResponse {
  try {
    if (!charmInfo || 'error' in charmInfo) {
      return { error: (charmInfo as ErrorResponse)?.error || 'Invalid charm information' };
    }

    const result: CharmInstance[] = [];

    charmInfo.outs.forEach((output, outputIndex) => {
      if (!output.charms) return;

      Object.keys(output.charms).forEach(appId => {
        const charmData = output.charms![appId];
        const appData = charmInfo.apps[appId];
        
        // Reconstruct the real appId from app_public_inputs
        const reconstructedAppId = reconstructAppId(appData, appId);

        // Clean app data by removing internal fields before exposing
        let cleanAppData: any = null;
        if (appData && typeof appData === 'object' && appData !== null && !Array.isArray(appData)) {
          cleanAppData = Object.assign({}, appData);
          if (cleanAppData._app_public_inputs_raw) {
            delete cleanAppData._app_public_inputs_raw;
          }
        }

        const charmInstance: CharmInstance = {
          utxo: {
            tx: txId,
            index: outputIndex
          },
          address: output.address || 'unknown',
          appId: reconstructedAppId,
          app: cleanAppData,
          appType: cleanAppData ? getAppType(cleanAppData) : undefined,
          verified: charmInfo.verified
        };

        // Process charm data (numeric or object)
        if (typeof charmData === 'number') {
          charmInstance.value = charmData;
        } else if (typeof charmData === 'object' && charmData !== null) {
          // Copy all fields dynamically using spread
          Object.assign(charmInstance, charmData);

          // Set default custom field if not present
          if (!charmInstance.custom) {
            charmInstance.custom = {};
          }
        }

        result.push(charmInstance);
      });
    });

    return result;
  } catch (error) {
    return { error: `Failed to create charm instances: ${(error as Error).message}` };
  }
}

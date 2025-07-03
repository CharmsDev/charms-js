import { ParsedCharmData, CharmInstance, ErrorResponse } from './types';
import { getAppType } from './utils';

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

        const charmInstance: CharmInstance = {
          utxo: {
            tx: txId,
            index: outputIndex
          },
          address: output.address || 'unknown',
          appId: appId,
          app: charmInfo.apps[appId] || null,
          appType: charmInfo.apps[appId] ? getAppType(charmInfo.apps[appId]) : undefined,
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

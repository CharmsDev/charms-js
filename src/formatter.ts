import { CharmSummary, DetailedCharm, ErrorResponse } from './types';
import { getAppType } from './utils';

// Formats charm information into detailed array of individual charms
export function formatDetailedCharms(charmInfo: CharmSummary, txId: string): DetailedCharm[] | ErrorResponse {
  try {
    if (!charmInfo || 'error' in charmInfo) {
      return { error: (charmInfo as ErrorResponse)?.error || 'Invalid charm information' };
    }

    const result: DetailedCharm[] = [];

    charmInfo.outs.forEach((output, outputIndex) => {
      if (!output.charms) return;

      Object.keys(output.charms).forEach(appId => {
        const charmData = output.charms![appId];

        const detailedCharm: DetailedCharm = {
          utxo: {
            tx: txId,
            index: outputIndex
          },
          address: output.address || 'unknown',
          appId: appId,
          app: charmInfo.apps[appId] || null,
          appType: charmInfo.apps[appId] ? getAppType(charmInfo.apps[appId]) : undefined
        };

        if (typeof charmData === 'number') {
          detailedCharm.value = charmData;
        } else if (typeof charmData === 'object') {
          const knownFields = [
            'ticker', 'remaining', 'name', 'description', 'url',
            'image', 'image_hash', 'decimals', 'ref'
          ];

          // Copy known fields
          knownFields.forEach(field => {
            if (field in charmData) {
              detailedCharm[field] = charmData[field];
            }
          });

          // Include additional fields
          Object.keys(charmData).forEach(key => {
            if (!knownFields.includes(key)) {
              detailedCharm[key] = charmData[key];
            }
          });
        }

        result.push(detailedCharm);
      });
    });

    return result;
  } catch (error) {
    return { error: `Failed to format detailed charms: ${(error as Error).message}` };
  }
}

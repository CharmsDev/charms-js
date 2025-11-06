export enum AppType {
  NFT = 'nft',
  TOKEN = 'token',
  UNKNOWN = 'unknown'
}

// Determines app type from app string
export function getAppType(appString: any): AppType {
  if (!appString || typeof appString !== 'string') {
    return AppType.UNKNOWN;
  }

  if (appString.startsWith('n/')) {
    return AppType.NFT;
  } else if (appString.startsWith('t/')) {
    return AppType.TOKEN;
  } else {
    return AppType.UNKNOWN;
  }
}

// Extracts app ID from app string format "n/[app_id]/..." or "t/[app_id]/..."
export function extractAppId(appString: any): string {
  if (!appString || typeof appString !== 'string') {
    return '';
  }

  const parts = appString.split('/');
  if (parts.length >= 2) {
    return parts[1];
  }

  return appString;
}

export enum AppType {
  NFT = 'nft',
  TOKEN = 'token',
  UNKNOWN = 'unknown'
}

// Determines app type from app string
export function getAppType(appString: string): AppType {
  if (!appString) {
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
export function extractAppId(appString: string): string {
  if (!appString) {
    return '';
  }

  const parts = appString.split('/');
  if (parts.length >= 2) {
    return parts[1];
  }

  return appString;
}

// Formats number with appropriate units (K, M)
export function formatNumber(value: number): string {
  if (value === undefined || value === null) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  } else {
    return value.toString();
  }
}

// Truncates string with ellipsis
export function truncateString(str: string, maxLength: number = 20): string {
  if (!str) {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }

  return `${str.substring(0, maxLength - 3)}...`;
}

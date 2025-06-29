# Charms JS

TypeScript library for decoding Bitcoin transactions containing Charms data.

## Installation

```bash
npm install charms-js
```

## Usage

### TypeScript

```typescript
import { decodeTransaction, decodeDetailedCharms, hasCharmsData } from 'charms-js';

// Example Bitcoin transaction hex containing Charms data
const txHex = '0200000000010...'; // Your transaction hex here

// Check if the transaction contains Charms data
const containsCharms = hasCharmsData(txHex);
console.log(`Contains Charms data: ${containsCharms}`);

if (containsCharms) {
  // Decode the transaction to get summary information
  const summary = decodeTransaction(txHex);
  console.log('Summary:', JSON.stringify(summary, null, 2));

  // Decode the transaction to get detailed charm information
  const detailedCharms = decodeDetailedCharms(txHex);
  console.log('Detailed Charms:', JSON.stringify(detailedCharms, null, 2));
}
```

### JavaScript

```javascript
const { decodeTransaction, decodeDetailedCharms, hasCharmsData } = require('charms-js');

// Example Bitcoin transaction hex containing Charms data
const txHex = '0200000000010...'; // Your transaction hex here

// Check if the transaction contains Charms data
const containsCharms = hasCharmsData(txHex);
console.log(`Contains Charms data: ${containsCharms}`);

if (containsCharms) {
  // Decode the transaction to get summary information
  const summary = decodeTransaction(txHex);
  console.log('Summary:', JSON.stringify(summary, null, 2));

  // Decode the transaction to get detailed charm information
  const detailedCharms = decodeDetailedCharms(txHex);
  console.log('Detailed Charms:', JSON.stringify(detailedCharms, null, 2));
}
```

## API

### `hasCharmsData(txHex: string): boolean`

Checks if a Bitcoin transaction contains Charms data.

- **Parameters:**
  - `txHex` - Hex string of the Bitcoin transaction
- **Returns:** `boolean` - True if the transaction contains Charms data, false otherwise

### `decodeTransaction(txHex: string): CharmSummary | ErrorResponse`

Decodes a Bitcoin transaction containing Charms data and returns summary information.

- **Parameters:**
  - `txHex` - Hex string of the Bitcoin transaction
- **Returns:** `CharmSummary | ErrorResponse` - Decoded charm information in summary format or an error response

### `decodeDetailedCharms(txHex: string): DetailedCharm[] | ErrorResponse`

Decodes a Bitcoin transaction and returns detailed information about each charm.

- **Parameters:**
  - `txHex` - Hex string of the Bitcoin transaction
- **Returns:** `DetailedCharm[] | ErrorResponse` - Array of detailed charm information or an error response

## Types

### `CharmSummary`

```typescript
interface CharmSummary {
  version: number;
  apps: Record<string, string>;
  ins: Array<{ utxo_id: string }>;
  outs: Array<{
    charms?: Record<string, any>;
    address?: string;
  }>;
}
```

### `DetailedCharm`

```typescript
interface DetailedCharm {
  utxo: {
    tx: string;
    index: number;
  };
  address: string;
  appId: string;
  app: string;
  appType: string;
  ticker?: string;
  remaining?: number;
  value?: number;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  image_hash?: string;
  decimals?: number;
  ref?: string;
}
```

### `ErrorResponse`

```typescript
interface ErrorResponse {
  error: string;
}
```

## License

MIT

# Charms JS

TypeScript library for decoding Bitcoin transactions containing Charms data.

## Installation

```bash
npm install charms-js
```

## Usage

### TypeScript

```typescript
import { decodeTransaction, hasCharmsData } from 'charms-js';

// Example Bitcoin transaction hex containing Charms data
const txHex = '0200000000010...'; // Your transaction hex here


// Check if the transaction contains Charms data
const containsCharms = hasCharmsData(txHex);
console.log(`Contains Charms data: ${containsCharms}`);

if (containsCharms) {
  // Decode the transaction to get charm information
  const charms = decodeTransaction(txHex);
  
  if ('error' in charms) {
    console.log(`Error: ${charms.error}`);
  } else {
    console.log('Charms:', JSON.stringify(charms, null, 2));
    console.log(`Found ${charms.length} charm(s)`);
  }
}
```

### JavaScript

```javascript
const { decodeTransaction, hasCharmsData } = require('charms-js');

// Example Bitcoin transaction hex containing Charms data
const txHex = '0200000000010...'; // Your transaction hex here


// Check if the transaction contains Charms data
const containsCharms = hasCharmsData(txHex);
console.log(`Contains Charms data: ${containsCharms}`);

if (containsCharms) {
  // Decode the transaction to get charm information
  const charms = decodeTransaction(txHex);
  
  if ('error' in charms) {
    console.log(`Error: ${charms.error}`);
  } else {
    console.log('Charms:', JSON.stringify(charms, null, 2));
    console.log(`Found ${charms.length} charm(s)`);
  }
}
```

## API

### `hasCharmsData(txHex: string): boolean`

Checks if a Bitcoin transaction contains Charms data.

- **Parameters:**
  - `txHex` - Hex string of the Bitcoin transaction
- **Returns:** `boolean` - True if the transaction contains Charms data, false otherwise

### `decodeTransaction(txHex: string): CharmInstance[] | ErrorResponse`

Decodes a Bitcoin transaction containing Charms data and returns detailed information about each charm.

- **Parameters:**
  - `txHex` - Hex string of the Bitcoin transaction
- **Returns:** `CharmInstance[] | ErrorResponse` - Array of detailed charm information or an error response

## Types

### `CharmInstance`

```typescript
interface CharmInstance {
  utxo: {
    tx: string;
    index: number;
  };
  address: string;
  appId: string;
  app: string | null;
  appType?: string;
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
  custom?: Record<string, any>;
}
```

### `ErrorResponse`

```typescript
interface ErrorResponse {
  error: string;
}
```

## Example

See the complete example in [`examples/example.ts`](examples/example.ts) which demonstrates:
- Checking if a transaction contains Charms data
- Decoding transaction and extracting charm data
- Error handling

Run the example:
```bash
npx ts-node examples/example.ts
```

## License

MIT

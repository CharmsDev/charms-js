# Charms JS

TypeScript library for decoding Bitcoin transactions containing Charms data.

## What's New in v2.0.2

- **Fixed app_public_inputs decoding**: Now properly decodes CBOR Map structures to canonical `t/<hash1>/<hash2>` format
- **Improved App ID reconstruction**: Eliminates placeholder `$0000` values with correct canonical App IDs
- **Enhanced compatibility**: Output format now matches wallet service implementation
- **Better data preservation**: Maintains associated values like `{ action: 'transfer' }` in app_public_inputs

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
  appId: string;  // Now properly reconstructed as 't/hash1/hash2' format
  app: Record<string, any> | null;  // Contains decoded app_public_inputs data
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
  verified?: boolean;
}
```

### `ErrorResponse`

```typescript
interface ErrorResponse {
  error: string;
}
```

## Example Output

With the latest fixes, decoded charms now include properly reconstructed App IDs:

```json
[
  {
    "utxo": {
      "tx": "1f1986613f3be85b8565ceff7db2c0ab20fd2e70d56fa78f41ce064743b43a2c",
      "index": 0
    },
    "address": "tb1pqayvc6ff9w6yfc6yu2luczt8lx800kg0vz47vp5czztpq55aqppsx8473c",
    "appId": "t/bd3af41907e148dfca5ba461da1f0b10b329abbb1a068da541323dafddf19b94/49dafd44a86f587258159760b6724f40ccaa0350bf503563ab33984e4dc31008",
    "app": {
      "action": "transfer"
    },
    "appType": "unknown",
    "value": 1800
  }
]
```

## Running Examples

See the complete example in [`examples/example.ts`](examples/example.ts) which demonstrates:
- Checking if a transaction contains Charms data
- Decoding transaction and extracting charm data
- Proper App ID reconstruction
- Error handling

Run the example:
```bash
npm run test
# or
npx ts-node examples/example.ts
```

## License

MIT

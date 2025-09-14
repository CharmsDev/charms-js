# Charms JS

Official TypeScript SDK for decoding Bitcoin transactions containing Charms data. Powered by the official `charms-lib` WASM module for maximum performance and accuracy.

## What's New in v3.0.0

- **🚀 Official WASM Integration**: Now uses the official `charms-lib` WASM module for spell extraction and verification
- **⚡ Simplified Architecture**: Eliminates manual CBOR parsing in favor of native WASM processing
- **🔒 Built-in Verification**: Automatic spell verification through the official Charms library
- **🔄 Hybrid API**: Seamless fallback to legacy implementation when WASM is unavailable
- **📦 Zero Configuration**: Works out-of-the-box with optional WASM acceleration

## Quick Start

### Basic Usage (Legacy Mode)

```typescript
import { decodeTransactionHybrid } from 'charms-js';

// Hybrid API - uses WASM when available, falls back to legacy
const charms = await decodeTransactionHybrid(txHex, 'testnet4');
```

### WASM-Accelerated Usage (Recommended)

```typescript
import { initializeWasm, decodeTransactionHybrid } from 'charms-js';

// Initialize with official charms-lib WASM module
const wasmModule = await import('./charms-lib/charms_lib.js');
initializeWasm(wasmModule);

// Now all calls use official WASM processing
const charms = await decodeTransactionHybrid(txHex, 'testnet4');
```

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

## API Reference

### Core Functions

#### `decodeTransactionHybrid(txHex: string, network?: BitcoinNetwork): Promise<CharmInstance[]>`

Hybrid decoding function that uses WASM when available, falls back to legacy implementation.

**Parameters:**
- `txHex` - Raw transaction hex string
- `network` - Bitcoin network (`'mainnet'` | `'testnet4'`, default: `'testnet4'`)

**Returns:** Array of `CharmInstance` objects

### WASM Integration

#### `initializeWasm(wasmModule: any): void`

Initializes the official charms-lib WASM module for enhanced performance.

#### `isWasmAvailable(): boolean`

Checks if WASM module is loaded and ready.

#### `getWasmInfo(): object`

Returns WASM module status and debug information.

### Legacy Functions

#### `decodeTransaction(txHex: string, config?: NetworkConfig): Promise<CharmInstance[] | ErrorResponse>`

Legacy CBOR-based decoding (maintained for compatibility).

#### `decodeTransactionById(txId: string, config?: NetworkConfig): Promise<CharmInstance[] | ErrorResponse>`

Fetches and decodes transaction by ID using legacy method.

## Types

### Data Types

#### `CharmInstance`

```typescript
interface CharmInstance {
  utxo: {
    tx: string;        // Transaction ID
    index: number;     // Output index
  };
  address: string;     // Bitcoin address
  appId: string;       // Canonical app ID (t/hash1/hash2)
  app: string | null;  // App-specific data
  appType?: AppType;   // Detected app type
  value?: number;      // Satoshi value
  verified?: boolean;  // WASM verification status
  // Additional charm metadata...
}
```

#### WASM vs Legacy Differences

| Feature | WASM Mode | Legacy Mode |
|---------|-----------|-------------|
| **Performance** | ⚡ Native speed | 🐌 JavaScript parsing |
| **Verification** | ✅ Built-in | ❌ Manual |
| **Accuracy** | 🎯 Official library | 📝 Best-effort |
| **Bundle Size** | 📦 +1.2MB WASM | 📦 Minimal |
| **Compatibility** | 🌐 Modern browsers | 🌐 Universal |

### `ErrorResponse`

```typescript
interface ErrorResponse {
  error: string;
}
```

## Example Output

Both WASM and legacy modes produce identical, verified charm data:

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
    "value": 1800,
    "verified": true
  }
]
```

## Examples

### Basic Example
```bash
npm run test
```

### WASM Integration Example
```bash
npx ts-node examples/wasm-example.ts
```

## Migration from v2.x

### Breaking Changes
- New hybrid API recommended over legacy functions
- WASM module must be explicitly initialized for best performance
- Some internal APIs have been restructured

### Migration Guide
```typescript
// v2.x
import { decodeTransaction } from 'charms-js';
const result = await decodeTransaction(txHex);

// v3.x (recommended)
import { decodeTransactionHybrid, initializeWasm } from 'charms-js';

// Optional: Initialize WASM for best performance
const wasm = await import('./charms-lib/charms_lib.js');
initializeWasm(wasm);

// Use hybrid API
const result = await decodeTransactionHybrid(txHex, 'testnet4');
```

## Architecture

Charms.js v3.0 integrates the official `charms-lib` WASM module, providing:

- **Native Performance**: WASM-based spell extraction and verification
- **Official Compatibility**: Uses the same library as Charms Wallet
- **Automatic Fallback**: Graceful degradation to JavaScript implementation
- **Zero Config**: Works immediately, WASM is optional enhancement

## License

MIT

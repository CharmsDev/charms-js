# Charms JS

TypeScript SDK for decoding Bitcoin transactions containing Charms data.

## Installation

```bash
npm install charms-js
```

## Usage

### Browser (Automatic WASM initialization)

```typescript
import { extractCharmsForWallet } from 'charms-js';

// Simple usage - WASM auto-initializes
const charms = await extractCharmsForWallet(
  txHex, 
  txId, 
  walletOutpoints, 
  'testnet4'
);

console.log('Charms found:', charms);
```

**Requirements for Browser:**
- Copy `charms_lib_bg.wasm` to your `public/` directory
- The library will automatically load and initialize the WASM module

### Node.js (Manual WASM initialization)

```typescript
import { initializeWasm, extractCharmsForWallet } from 'charms-js/dist/node';

// Manual WASM initialization required
const wasmBindings = await import('charms-js/dist/wasm/charms_lib_bg.js');
const fs = require('fs');
const wasmBuffer = fs.readFileSync('path/to/charms_lib_bg.wasm');

const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
  './charms_lib_bg.js': wasmBindings
});

wasmBindings.__wbg_set_wasm(wasmModule.instance.exports);
initializeWasm(wasmBindings);

// Now you can use the library
const charms = await extractCharmsForWallet(txHex, txId, walletOutpoints, 'testnet4');
```

## File Structure

```
src/
├── index.ts          # Browser entry point (auto-init WASM)
├── node.ts           # Node.js entry point (manual init)
├── browser.ts        # Browser-specific WASM auto-initialization
├── wasm-integration.ts # Core WASM integration logic
├── wallet-adapter.ts # Wallet filtering utilities
└── wasm/            # WASM binaries and bindings
    ├── charms_lib_bg.wasm
    └── charms_lib_bg.js
```

## API Reference

### `extractCharmsForWallet(txHex, txId, walletOutpoints, network?)`

Extracts charms from a transaction, filtered by wallet ownership.

**Parameters:**
- `txHex`: Transaction hex string
- `txId`: Transaction ID
- `walletOutpoints`: Set of wallet-owned outpoints (`txid:vout`)
- `network`: 'mainnet' or 'testnet4' (default: 'testnet4')

**Returns:** `Promise<CharmObj[]>`

### Browser-only functions

- `isWasmReady()`: Check if WASM is initialized

## Types

```typescript
interface CharmObj {
  appId: string;
  amount: number;           // Amount in satoshis
  version: number;
  metadata: {
    ticker?: string;
    name?: string;
    description?: string;
    image?: string;
    image_hash?: string;
    url?: string;
  };
  app: Record<string, any>;
  outputIndex: number;      // Zero-based output index in the transaction
  txid: string;             // Transaction ID in display format (little-endian, reversed bytes)
  address: string;          // Bitcoin address for this output (P2PKH, P2SH, P2WPKH, P2WSH, or P2TR)
}
```

### Important Notes

**Transaction ID Format:**
The `txid` field is returned in **display format** (little-endian, reversed bytes), which matches the format used by block explorers like mempool.space. This is the standard format for displaying transaction IDs to users.

**Output Index:**
The `outputIndex` corresponds to the position of this charm's output in the transaction, starting from 0. Use this with `txid` to uniquely identify the UTXO: `${txid}:${outputIndex}`

**Address:**
The `address` field contains the Bitcoin address that controls this output. This is extracted directly from the output's scriptPubKey and supports all standard address types including Taproot (P2TR).

## Migration from v3.0.x

**Browser users:** Replace manual WASM initialization with direct imports:

```typescript
// OLD (manual)
await ensureWasmInitialized();
const charms = await extractCharmsForWallet(...);

// NEW (automatic)
import { extractCharmsForWallet } from 'charms-js';
const charms = await extractCharmsForWallet(...);
```

- The WASM extraction operates on `txHex`. The `txid` included in `CharmObj` is provided for identification and wallet filtering convenience.

## License

MIT

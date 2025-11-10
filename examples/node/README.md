# Node.js Example

This example demonstrates how to use charms-js in a Node.js environment.

## Running the Example

```bash
# From the root of the project
npm run build
node examples/node/example.ts
```

## What it does

1. Initializes the WASM module (required for Node.js)
2. Fetches a transaction from mempool.space
3. Extracts charms from the transaction
4. Displays the results

## Key Points

- **WASM Initialization**: In Node.js, you must manually initialize the WASM module
- **Import from**: `charms-js/dist/node.js` for Node.js environment
- **Network Support**: Both mainnet and testnet4 are supported

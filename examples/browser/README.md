# Browser Example

This example demonstrates how to use charms-js in a browser environment.

## Running the Example

```bash
# From the root of the project
npm run build

# Start the dev server
npx vite --config examples/browser/vite.config.js

# Open http://localhost:3000 in your browser
```

## What it does

1. Provides a simple UI to enter a transaction ID
2. Fetches the transaction hex from mempool.space
3. Extracts charms using charms-js (WASM auto-initializes)
4. Displays the results in a user-friendly format

## Key Points

- **Auto-initialization**: WASM initializes automatically in the browser
- **Import from**: `charms-js` (default export for browser)
- **No polyfills needed**: Uses `@scure/btc-signer` which is browser-native
- **Bundler**: Requires a bundler like Vite, Webpack, or Rollup
- **WASM file**: The bundler must be configured to serve `.wasm` files

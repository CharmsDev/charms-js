/**
 * Browser-optimized entry point for charms-js
 * Provides clean, direct function imports with automatic WASM initialization
 */

// Export the main browser-ready functions
export { 
    extractCharmsForWallet, 
    extractAndVerifySpell,
    isWasmReady
} from './browser.js';

// Export types for TypeScript users
export * from './shared/types.js';

// Export utility functions
export * from './shared/utils.js';

// Re-export wallet adapter functions for compatibility
export { normalizeCharmForWallet } from './shared/wallet-adapter.js';

// Export WASM initialization for Node.js compatibility
export { initializeWasm } from './shared/wasm-integration.js';

// Default export for simple usage
import { extractCharmsForWallet } from './browser.js';
export default extractCharmsForWallet;

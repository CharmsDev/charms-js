# Changelog

All notable changes to this project will be documented in this file.

## [3.3.0] - 2025-11-10

### Changed
- **BREAKING:** Replaced `bitcoinjs-lib` with `@scure/btc-signer` for better browser compatibility
  - Eliminates need for Node.js polyfills (Buffer, etc.) in browser environments
  - Smaller bundle size and faster load times
  - Native ES modules support
  - All functionality remains the same, no API changes

### Added
- Clean, organized examples structure:
  - `examples/node/` - Node.js usage example with full documentation
  - `examples/browser/` - Browser usage example with Vite setup
  - Comprehensive README files for each example

### Improved
- Professional code comments and documentation
- Better JSDoc annotations for all public functions
- Cleaner codebase without debug artifacts

### Migration Guide
- No code changes required for users
- Simply update to `charms-js@3.3.0`
- Browser builds will be smaller and faster
- No polyfills needed in your bundler configuration

## [3.2.2] - 2025-11-07

### Fixed
- **CRITICAL:** Fixed SegWit transaction ID calculation in browser.ts
  - The `calculateTxIdFromHex()` function was incorrectly hashing the full transaction including witness data
  - Now properly removes marker, flag, and witness data to calculate txId from legacy format
  - This fixes address extraction being swapped between outputs in browser/wallet environments
  - Added `removeWitnessData()`, `readVarInt()`, and `writeVarInt()` helper functions
  - Node.js version was unaffected (uses bitcoinjs-lib directly)

### Impact
- All SegWit transactions will now have correct txIds and addresses in browser/wallet contexts
- Wallet charm extraction will now show correct addresses for each output

## [3.2.1] - 2025-11-06

### Changed
- Previous version with WASM integration

## [3.2.0] - 2025-11-05

### Added
- WASM-based spell extraction and verification
- Browser-ready version with automatic WASM initialization
- Network configuration support (mainnet/testnet4)

## [2.0.0] - 2025-10-15

### Breaking Changes
- Removed verification system entirely
- Added network parameter to functions
- New decodeTransactionById function with network support
- Changed error response format
- Removed verified field from CharmInstance type

### Added
- Simplified extraction-only API
- Better error handling
- Network-aware transaction decoding

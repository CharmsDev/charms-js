# Changelog

All notable changes to this project will be documented in this file.

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

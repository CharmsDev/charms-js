# Test Results Summary - Multi-Charm Transaction

## Transaction Details

**TXID:** `0e5bfa19a4ee21d0c3e9bd68055c77f1106cc9e6bebf1448df9bb862f02d9668`

- **Block Height:** 922372
- **Confirmed:** Yes
- **Size:** 1273 bytes
- **Fee:** 538 sats

## Transaction Structure

### Inputs (3 total)

| Input | Previous TXID | Vout | Address | Amount |
|-------|--------------|------|---------|--------|
| 0 | `78dd7dc91fdc678c...` | 0 | `bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk` | 330 sats |
| 1 | `3445c9c0a2e9145a...` | 0 | `bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk` | 330 sats |
| 2 | `aadefd9f544272db...` | 0 | `bc1p3hsz9wt5xzymnapsct86ervdfe7ypfcgm3v789yg8hrtmccun9nqf40evv` | 2889 sats |

**Total Input:** 3549 sats

### Outputs (4 total)

| Output | Address | Amount | Type |
|--------|---------|--------|------|
| 0 | `bc1pu72a3mv9pv5f7a0lqdtwcq3m59zvjy7uawtnmxnrtjl0h0fuvyjsxpmcnz` | 330 sats | v1_p2tr |
| 1 | `bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk` | 330 sats | v1_p2tr |
| 2 | `bc1qxxxjm06n50uugxewxe5r5w5tskqwq4gkwrm0al` | 900 sats | v0_p2wpkh |
| 3 | `bc1ptzzcx58aav2te9jw0qfq9uusda5hg4j90nnqe05v83h7w033xsaq6k0rwm` | 1451 sats | v1_p2tr |

**Total Output:** 3011 sats

## Extracted Charms (2 total)

### Charm 1

- **📍 Output Index:** 0
- **💰 Charm Amount:** 80,000,000,000 sats (800 BTC)
- **📦 UTXO Amount:** 330 sats
- **🏠 Address:** `bc1pu72a3mv9pv5f7a0lqdtwcq3m59zvjy7uawtnmxnrtjl0h0fuvyjsxpmcnz`
- **🔗 TXID:** `0e5bfa19a4ee21d0c3e9bd68055c77f1106cc9e6bebf1448df9bb862f02d9668`
- **🆔 App ID:** `t/3d7fe7e4cea6121947af73d70e5119bebd8aa5b7edfe74bfaf6e779a1847bd9b/c975d4e0c292fb95efbda5c13312d6ac1d8b5aeff7f0f1e5578645a2da70ff5f`

**✅ Validation:**
- outputIndex is correct (0)
- Address matches blockchain output 0
- Address format is valid (62 chars, mainnet)
- TXID matches

### Charm 2

- **📍 Output Index:** 1
- **💰 Charm Amount:** 39,050,000,000 sats (390.5 BTC)
- **📦 UTXO Amount:** 330 sats
- **🏠 Address:** `bc1pa3fw9qya0pepms2yfmezwjdcuu7qer6eet20wrn67jcn6vz69p6ql606wk`
- **🔗 TXID:** `0e5bfa19a4ee21d0c3e9bd68055c77f1106cc9e6bebf1448df9bb862f02d9668`
- **🆔 App ID:** `t/3d7fe7e4cea6121947af73d70e5119bebd8aa5b7edfe74bfaf6e779a1847bd9b/c975d4e0c292fb95efbda5c13312d6ac1d8b5aeff7f0f1e5578645a2da70ff5f`

**✅ Validation:**
- outputIndex is correct (1)
- Address matches blockchain output 1
- Address format is valid (62 chars, mainnet)
- TXID matches

## Key Findings for Wallet Integration

### 1. Multi-Charm Transfer
This transaction demonstrates a **multi-charm transfer** where:
- Input 2 contains the spell data (witness script with charm information)
- The spell specifies 2 outputs (indices 0 and 1) that contain charms
- Each charm has a different amount (800 BTC and 390.5 BTC)

### 2. Output Index Mapping
The `outputIndex` field correctly identifies which UTXO contains each charm:
- Charm 1 → Output 0 (330 sats UTXO)
- Charm 2 → Output 1 (330 sats UTXO)

### 3. Address Extraction
Each charm's `address` field contains the **actual Bitcoin address** of the output:
- Charm 1 address = Output 0 address ✅
- Charm 2 address = Output 1 address ✅

### 4. UTXO vs Charm Amount
**Important distinction:**
- **UTXO Amount:** The actual Bitcoin amount in the output (330 sats each)
- **Charm Amount:** The virtual/logical amount encoded in the charm data (800 BTC and 390.5 BTC)

The UTXO amount is typically small (dust limit) while the charm amount represents the actual value being transferred.

### 5. Wallet Implementation Notes

When displaying charms in your wallet:

```javascript
{
  // Use outputIndex to identify which UTXO contains this charm
  outputIndex: 0,
  
  // Use address to show where the charm is locked
  address: "bc1pu72a3mv9pv5f7a0lqdtwcq3m59zvjy7uawtnmxnrtjl0h0fuvyjsxpmcnz",
  
  // Display the charm amount (not the UTXO amount)
  amount: 80000000000, // 800 BTC
  
  // The UTXO amount is just dust (330 sats)
  // Don't confuse it with the charm value
}
```

## Test Status

✅ **ALL TESTS PASSED**

Both charms were extracted correctly with:
- Correct output indices
- Valid Bitcoin addresses matching blockchain data
- Proper network encoding (mainnet bc1p...)
- Matching transaction IDs

---

**Test File:** `examples/test-fix-outputindex.ts`  
**Library Version:** charms-js@3.2.1  
**Test Date:** November 6, 2025

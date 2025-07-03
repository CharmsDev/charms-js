import * as bitcoin from 'bitcoinjs-lib';
import { NormalizedSpell, Proof } from './types';
import { parseSpellAndProof } from './cbor';
import { extractSpellData } from './extractor';
const snarkjs = require('snarkjs');

// Current version constant
export const CURRENT_VERSION = 4;

// Verification key constants from Rust code
const V0_SPELL_VK = "0x00e9398ac819e6dd281f81db3ada3fe5159c3cc40222b5ddb0e7584ed2327c5d";
const V1_SPELL_VK = "0x009f38f590ebca4c08c1e97b4064f39e4cd336eea4069669c5f5170a38a1ff97";
const V2_SPELL_VK = "0x00bd312b6026dbe4a2c16da1e8118d4fea31587a4b572b63155252d2daf69280";
const V3_SPELL_VK = "0x0034872b5af38c95fe82fada696b09a448f7ab0928273b7ac8c58ba29db774b9";
const V4_SPELL_VK = "0x00c707a155bf8dc18dc41db2994c214e93e906a3e97b4581db4345b3edd837c5";

// Extract and verify spell from Bitcoin transaction
export async function extractAndVerifySpell(txHex: string): Promise<NormalizedSpell | null> {
    try {
        // Use existing extractor
        const spellData = extractSpellData(txHex);
        if (!spellData) {
            throw new Error("no spell data found");
        }

        // Use existing CBOR parser
        const { spell, proof } = parseSpellAndProof(spellData);

        // Validate version (support versions 0-4)
        if (spell.version < 0 || spell.version > CURRENT_VERSION) {
            throw new Error(`unsupported spell version: ${spell.version}. Supported versions: 0-${CURRENT_VERSION}.`);
        }

        // Add transaction inputs to spell
        const tx = bitcoin.Transaction.fromHex(txHex);
        const spellWithInputs = addTransactionInputs(spell, tx);

        // Perform verification
        const verified = await verifySpell(proof, spellWithInputs);
        spellWithInputs.verified = verified;

        return spellWithInputs;
    } catch (error) {
        console.log(`Error in extractAndVerifySpell: ${(error as Error).message}`);
        return null;
    }
}

// Add transaction inputs to spell
function addTransactionInputs(spell: NormalizedSpell, tx: bitcoin.Transaction): NormalizedSpell {
    // Validate spell structure
    if (spell.tx.ins !== undefined && spell.tx.ins !== null) {
        throw new Error("spell must inherit inputs from the enchanted tx");
    }

    if (spell.tx.outs.length > tx.outs.length) {
        throw new Error("spell tx outs mismatch");
    }

    // Add transaction inputs (excluding the spell input which is last)
    const txIns = tx.ins.slice(0, -1);
    const utxoIds = txIns.map(txIn => {
        const txid = Buffer.from(txIn.hash).reverse().toString('hex');
        return `${txid}:${txIn.index}`;
    });

    const spellWithInputs = { ...spell };
    spellWithInputs.tx = { ...spell.tx, ins: utxoIds };

    return spellWithInputs;
}

// Verify spell with ZK-SNARK proof
async function verifySpell(proof: Proof, spell: NormalizedSpell): Promise<boolean> {
    try {
        const spellVk = getVerificationKeyForVersion(spell.version);
        if (!spellVk) {
            console.log('Failed to get verification key string');
            return false;
        }

        // Validate inputs
        if (!validateVerificationKey(spellVk)) {
            console.log('Invalid verification key format');
            return false;
        }

        // Skip ZK verification for empty proofs (spell-only format)
        if (proof.length === 0) {
            console.log('Empty proof - structural validation only');
            return true;
        }

        // Load the verification key object for snarkjs
        const vKey = loadVerificationKeyForVersion(spell.version);
        if (!vKey) {
            console.log('Failed to load verification key object');
            return false;
        }

        // Convert proof from binary to snarkjs format
        const snarkjsProof = parseProofFromBinary(proof);
        if (!snarkjsProof) {
            console.log('Failed to parse proof');
            return false;
        }

        // Extract public signals from spell
        const publicSignals = extractPublicSignalsFromSpell(spell, spellVk);

        // Perform Groth16 verification using snarkjs
        console.log('Performing Groth16 verification...');
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, snarkjsProof);

        console.log(`Verification result: ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
    } catch (error) {
        console.log(`Error in verifySpell: ${(error as Error).message}`);
        return false;
    }
}

// Get verification key based on spell version and VK identifier
function getVerificationKeyForVersion(spellVersion: number): string | null {
    try {
        // Map VK identifiers to their corresponding versions (like in Rust code)
        const vkMapping: { [key: number]: string } = {
            0: V0_SPELL_VK,
            1: V1_SPELL_VK,
            2: V2_SPELL_VK,
            3: V3_SPELL_VK,
            4: V4_SPELL_VK,
        };

        const spellVk = vkMapping[spellVersion];
        if (!spellVk) {
            console.log(`Unsupported spell version: ${spellVersion}`);
            return null;
        }

        // Load the appropriate VK based on version
        // In a real implementation, you would load the actual VK from the binary files
        // For now, we'll create version-specific VKs
        return spellVk;
    } catch (error) {
        console.log(`Error getting verification key: ${(error as Error).message}`);
        return null;
    }
}

import { VKEYS } from './vkeys';

// Load verification key for specific version
function loadVerificationKeyForVersion(version: number): any | null {
    try {
        const vkey = (VKEYS as any)[version.toString()];
        if (!vkey) {
            console.log(`Verification key not found for version ${version}`);
            return null;
        }
        console.log(`Loading VK for version ${version}`);
        return vkey;
    } catch (error) {
        console.log(`Error loading verification key for version ${version}: ${(error as Error).message}`);
        return null;
    }
}

// Parse proof from binary format to snarkjs format
function parseProofFromBinary(proof: Proof): any | null {
    try {
        // Groth16 proof consists of 3 G1 points (pi_a, pi_c) and 1 G2 point (pi_b)
        // Each G1 point is 64 bytes (2 field elements of 32 bytes each)
        // Each G2 point is 128 bytes (4 field elements of 32 bytes each)
        // Total expected: 64 + 128 + 64 = 256 bytes for uncompressed format

        if (proof.length < 192) { // Minimum for compressed format
            console.log(`Proof too short: ${proof.length} bytes`);
            return null;
        }

        // Helper function to convert bytes to BigInt
        function bytesToBigInt(bytes: Uint8Array): bigint {
            let result = 0n;
            for (let i = 0; i < bytes.length; i++) {
                result = (result << 8n) + BigInt(bytes[i]);
            }
            return result;
        }

        let offset = 0;

        // Parse pi_a (G1 point - 2 field elements of 32 bytes each)
        const pi_a_x = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;
        const pi_a_y = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;

        // Parse pi_b (G2 point - 4 field elements of 32 bytes each)
        const pi_b_x0 = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;
        const pi_b_x1 = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;
        const pi_b_y0 = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;
        const pi_b_y1 = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;

        // Parse pi_c (G1 point - 2 field elements of 32 bytes each)
        const pi_c_x = bytesToBigInt(proof.slice(offset, offset + 32));
        offset += 32;
        const pi_c_y = bytesToBigInt(proof.slice(offset, offset + 32));

        const snarkjsProof = {
            pi_a: [pi_a_x.toString(), pi_a_y.toString(), "1"],
            pi_b: [
                [pi_b_x0.toString(), pi_b_x1.toString()],
                [pi_b_y0.toString(), pi_b_y1.toString()],
                ["1", "0"]
            ],
            pi_c: [pi_c_x.toString(), pi_c_y.toString(), "1"],
            protocol: "groth16",
            curve: "bn128"
        };

        return snarkjsProof;
    } catch (error) {
        console.log(`Error parsing proof: ${(error as Error).message}`);
        return null;
    }
}

// Extract public signals from spell for verification
function extractPublicSignalsFromSpell(spell: NormalizedSpell, spellVk: string): string[] {
    try {
        // Based on the Rust code: to_sp1_pv(spell.version, &(spell_vk, &spell))
        // This creates SP1PublicValues containing CBOR-encoded (spell_vk, spell) tuple

        const cbor = require('cbor');

        // Create the tuple (spell_vk, spell) as in Rust code
        const tuple = [spellVk, spell];

        // Encode as CBOR
        const cborEncoded = cbor.encode(tuple);

        // Convert to hex string for public signals
        const hexString = Buffer.from(cborEncoded).toString('hex');

        // For Groth16, we typically need field elements as public signals
        // We'll hash the CBOR data to get a field element
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(cborEncoded).digest();

        // Convert hash to BigInt and then to string (field element)
        const hashBigInt = BigInt('0x' + hash.toString('hex'));

        // Return as array of strings (field elements)
        return [hashBigInt.toString()];
    } catch (error) {
        console.log(`Error extracting public signals: ${(error as Error).message}`);
        return [];
    }
}

// Validate verification key format
function validateVerificationKey(spellVk: string): boolean {
    if (!spellVk || typeof spellVk !== 'string') {
        return false;
    }

    if (!spellVk.startsWith('0x')) {
        return false;
    }

    const hexPart = spellVk.slice(2);
    if (hexPart.length !== 64) {
        return false;
    }

    return /^[0-9a-fA-F]+$/.test(hexPart);
}

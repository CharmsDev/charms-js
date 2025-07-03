import { decode as cborDecode } from 'cbor';
import { NormalizedSpell, Proof } from './types';

// Parse spell and proof tuple from CBOR data
export function parseSpellAndProof(spellData: Buffer): { spell: NormalizedSpell; proof: Proof } {
    const [spell, proofBuf] = cborDecode(spellData) as [NormalizedSpell, Buffer];
    return { spell, proof: new Uint8Array(proofBuf) };
}

import { Address, OutScript } from '@scure/btc-signer';
import { hex } from '@scure/base';

/**
 * Extracts a Bitcoin address from an output script.
 * Supports all standard output types including P2PKH, P2SH, P2WPKH, P2WSH, and P2TR (Taproot).
 * 
 * @param scriptBuf - The scriptPubKey as a Buffer
 * @param network - Target network ('mainnet' or 'testnet4')
 * @returns The decoded address string, or empty string if decoding fails
 */
export function extractAddress(scriptBuf: Buffer, network: 'mainnet' | 'testnet4' = 'testnet4'): string {
    try {
        const scriptBytes = new Uint8Array(scriptBuf);
        const decoded = OutScript.decode(scriptBytes);
        
        // @scure/btc-signer uses undefined for mainnet, 'testnet' for testnet
        const address = network === 'mainnet' 
            ? Address().encode(decoded)
            : Address('testnet' as any).encode(decoded);
        
        return address;
    } catch (error) {
        return '';
    }
}

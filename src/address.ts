import * as bitcoin from 'bitcoinjs-lib';

// Extract address from output script with network fallback and P2TR support
export function extractAddress(scriptBuf: Buffer): string {
    const networks = [bitcoin.networks.testnet, bitcoin.networks.bitcoin];

    // Try standard address extraction for both networks
    for (const network of networks) {
        try {
            return bitcoin.address.fromOutputScript(scriptBuf, network);
        } catch {
            // Continue to next network
        }
    }

    // Fallback to manual P2TR decode
    const chunks = bitcoin.script.decompile(scriptBuf);
    if (chunks && chunks.length > 1) {
        if (chunks[0] === bitcoin.opcodes.OP_1 && Buffer.isBuffer(chunks[1]) && chunks[1].length === 32) {
            const key = chunks[1];

            // Try testnet first, then mainnet
            try {
                return bitcoin.address.toBech32(key, 1, 'tb');
            } catch {
                try {
                    return bitcoin.address.toBech32(key, 1, 'bc');
                } catch {
                    // Fall through to unknown
                }
            }
        }
    }

    return 'unknown';
}

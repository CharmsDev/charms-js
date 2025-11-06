import * as bitcoin from 'bitcoinjs-lib';

// Extract address from output script with network support and P2TR support
export function extractAddress(scriptBuf: Buffer, network: 'mainnet' | 'testnet4' = 'testnet4'): string {
    // Determine network priority based on parameter
    const primaryNetwork = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    const fallbackNetwork = network === 'mainnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const networks = [primaryNetwork, fallbackNetwork];

    // Try standard address extraction for both networks
    for (const net of networks) {
        try {
            return bitcoin.address.fromOutputScript(scriptBuf, net);
        } catch {
            // Continue to next network
        }
    }

    // Fallback to manual P2TR decode
    const chunks = bitcoin.script.decompile(scriptBuf);
    if (chunks && chunks.length > 1) {
        if (chunks[0] === bitcoin.opcodes.OP_1 && Buffer.isBuffer(chunks[1]) && chunks[1].length === 32) {
            const key = chunks[1];

            // Use the correct network prefix
            const prefix = network === 'mainnet' ? 'bc' : 'tb';
            try {
                return bitcoin.address.toBech32(key, 1, prefix);
            } catch {
                // Try the other network as fallback
                const fallbackPrefix = network === 'mainnet' ? 'tb' : 'bc';
                try {
                    return bitcoin.address.toBech32(key, 1, fallbackPrefix);
                } catch {
                    // Fall through to unknown
                }
            }
        }
    }

    return '';
}

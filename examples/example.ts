import { decodeTransaction, hasCharmsData, extractAndVerifySpell } from '../src/index';
import { extractSpellData } from '../src/extractor';
import { decodeCbor } from '../src/decoder';

// Example Bitcoin transaction hex containing Charms data (CHARMS-19 token)
const txHex = '02000000000102ddaabd5f68992d3a97ec3f7f4a553b80f40811b1cc7dcaa4c3d4d57a42c903440000000000ffffffff9ce50d1bea2cb80b38a63e5e2e29e4efd9d4c9da15f1a73b11415ceecb1a351d0000000000ffffffff03e8030000000000002251208c821ceda66308fedf5283f5aaac2f3b1c17b529d983e2f1734794037beec335e8030000000000002251206eb2ec4ab68e29176884e783dfd93bc42b9310f5ae47a202d0978988cebe1f87f673000000000000225120d2c2385fdea0d44dc25b67caf4aef4c711dea2a72b40a43cce34d82e601a78de01402f13c070c4c4a10019d4814b3939befb87d59b376f645c8416a7e3a71c006b6decf0335476f9c4c34b68aea56bd00d6a47d7a6374060254d3431a8cf7182eac70341a65486322df7d3205fd81d3afcb39fef631edc855e1b15a666d9aa2f8998cb1fa094fbccdb7b6e1b44d7fc753e9ebdb78736b08bcfbde4f67a2a234f60b23b9e81fd78030063057370656c6c4d080282a36776657273696f6e04627478a2647265667380646f75747382a1011903e6a100a2667469636b657269434841524d532d31396972656d61696e696e671a000182ba716170705f7075626c69635f696e70757473a283616e982018ae07189e1893181e188818ab188818231822182f18ba18ca0a18f518af18fe184302182518470e18a1188a18b8184b18fd182d184318d4183e18cc982018770b18c3183418d418301886183013181817182418d6121843185218d1182f1825182018a7183818e108183b18ac18a8183c189d189718301837f6836174982018ae07189e1893181e188818ab188818231822182f18ba18ca0a18f518af18fe184302182518470e18a1188a18b8184b18fd182d184318d4183e18cc982018770b18c3183418d418301886183013181817182418d6121843185218d1182f1825182018a7183818e108183b18ac18a8183c189d189718301837f699010418a41859184c1859181f18f9186f1618f3187718b218ea183e17189e1518931869189e18241831186a1858189f181918be031821184d188e18361846185118a6184f18e11718fb183b18de181f18ca18371846001893141891183d189118cc18471718aa182318e7187b18f018540618f0185e188118af1873186d18881847182618e6186f18661867183818e618c318c80a18b218f6186818440018b318d818b0183a188f18bc181e18b318fe18ad18d84d3f0116188b0e182c18a3181b0f18b0188c188918f818f1186c18ee18a0187618af18ca18bb18cc18e3189618dd18c9182e18a2188b184918290d181c18671880181e18b6181a187f18df181b18e4186a18de1894184a1845188818aa181f18df1855189918f91889184e186b18bb1846187418cf185618e4187e185218b618b2189d181a18fa18ef18a70218bc18d718f918f718a0188b18b7182018a518b518cd18b614187318aa184318a3184d0618e9189a188a185e0c18d218b618f9184718c11868189a182607187d1818184c182f189a189918941872188118a418d1186e184c18eb182118b818ed0e18ed18a118dd1838187318d6185718e418e8183e18db181e181c18f0182b0f18ba189c183918811849189418191894184b18960c18a71618f2182c185a18ee18b318bd18481856183218b018ab187018b61875186d68203e9999b13a977385f28b44948c997128f3a16c62f7dbe4664010f0061871a9ceac21c13e9999b13a977385f28b44948c997128f3a16c62f7dbe4664010f0061871a9ce00000000';


async function runExample() {
    console.log('=== Charms JS Example ===\n');

    // 1. Check if the transaction contains Charms data
    console.log('1. Checking if transaction contains Charms data...');
    const containsCharms = hasCharmsData(txHex);
    console.log(`   Contains Charms data: ${containsCharms}\n`);

    if (containsCharms) {
        // 2. First, extract spell data to get the version
        console.log('2. Extracting spell version...');
        try {
            const spellData = extractSpellData(txHex);
            if (spellData) {
                const normalizedSpell = decodeCbor(spellData);
                if (normalizedSpell) {
                    console.log(`   Spell version: ${normalizedSpell.version}\n`);

                    // 3. Now decode and verify with the appropriate VK
                    console.log('3. Decoding and verifying transaction...');
                    const charms = await decodeTransaction(txHex);

                    if ('error' in charms) {
                        console.log(`   Error: ${charms.error}`);
                    } else {
                        console.log('   Decoded Charms:');
                        console.log(JSON.stringify(charms, null, 4));
                        console.log(`\n   Found ${charms.length} charm(s) in this transaction.`);

                        // 4. Demonstrate separate verification call
                        console.log('\n4. Testing separate verification...');
                        const verifiedSpell = await extractAndVerifySpell(txHex);
                        if (verifiedSpell) {
                            console.log(`   Verification result: ${verifiedSpell.verified ? 'VERIFIED' : 'FAILED'}`);
                            console.log(`   Spell version: ${verifiedSpell.version}`);
                        } else {
                            console.log('   Verification failed - could not extract spell');
                        }
                    }
                } else {
                    console.log('   Error: Could not decode CBOR data');
                }
            } else {
                console.log('   Error: Could not extract spell data');
            }
        } catch (error) {
            console.log(`   Error: ${(error as Error).message}`);
        }
    } else {
        console.log('   No Charms data found in this transaction.');
    }
}

// Run the example
runExample().catch(console.error);

import * as bitcoin from 'bitcoinjs-lib';

// Extracts spell data from Bitcoin transaction
export function extractSpellData(txHex: string): Buffer | null {
  try {
    const tx = bitcoin.Transaction.fromHex(txHex);

    // First, try to extract from witness data in all inputs
    const witnessSpell = extractSpellFromWitnessInputs(tx);
    if (witnessSpell) {
      return witnessSpell;
    }

    // If no witness data found, try OP_RETURN outputs
    const opReturnSpell = extractSpellFromOpReturnOutputs(tx);
    if (opReturnSpell) {
      return opReturnSpell;
    }

    console.log('No spell data found in transaction');
    return null;
  } catch (error) {
    console.log(`Error extracting spell data: ${(error as Error).message}`);
    return null;
  }
}

// Extract spell data from witness inputs (current method)
function extractSpellFromWitnessInputs(tx: bitcoin.Transaction): Buffer | null {
  if (!tx.ins || tx.ins.length === 0) {
    return null;
  }

  // Try all inputs, not just the second one
  for (let i = 0; i < tx.ins.length; i++) {
    const input = tx.ins[i];
    
    if (input.witness && input.witness.length >= 2) {
      // Try taproot leaf script (second witness element)
      const witnessScript = input.witness[1];
      const spellData = extractSpellFromWitnessScript(witnessScript);
      
      if (spellData) {
        console.log(`Found spell data in input ${i} witness`);
        return spellData;
      }
    }
  }

  return null;
}

// Extract spell data from OP_RETURN outputs
function extractSpellFromOpReturnOutputs(tx: bitcoin.Transaction): Buffer | null {
  if (!tx.outs || tx.outs.length === 0) {
    return null;
  }

  // Search all outputs for OP_RETURN with spell data
  for (let i = 0; i < tx.outs.length; i++) {
    const output = tx.outs[i];
    
    if (output.script && output.script.length > 0) {
      // Check if it's an OP_RETURN script (starts with 0x6a)
      if (output.script[0] === 0x6a) {
        const spellData = extractSpellFromOpReturnScript(output.script);
        
        if (spellData) {
          console.log(`Found spell data in output ${i} OP_RETURN`);
          return spellData;
        }
      }
    }
  }

  return null;
}

// Extract spell data from OP_RETURN script
function extractSpellFromOpReturnScript(script: Buffer): Buffer | null {
  try {
    const scriptHex = script.toString('hex');
    
    // Skip OP_RETURN opcode (6a) and look for spell data
    const SPELL_HEX = '7370656c6c'; // "spell" in hex
    
    const spellIndex = scriptHex.indexOf(SPELL_HEX);
    if (spellIndex === -1) {
      return null;
    }

    // Extract data after "spell" marker
    const dataStartIndex = spellIndex + SPELL_HEX.length;
    const remainingHex = scriptHex.substring(dataStartIndex);
    
    // Try to parse as direct CBOR data
    if (remainingHex.length > 0) {
      const cborData = Buffer.from(remainingHex, 'hex');
      console.log('Extracted CBOR data from OP_RETURN (first 100 chars):', cborData.toString('hex').substring(0, 100) + '...');
      console.log('CBOR data length:', cborData.length, 'bytes');
      return cborData;
    }

    return null;
  } catch (error) {
    console.log(`Error extracting spell from OP_RETURN script: ${(error as Error).message}`);
    return null;
  }
}

// Extracts spell data from witness script
function extractSpellFromWitnessScript(witnessScript: Buffer): Buffer | null {
  try {
    const scriptHex = witnessScript.toString('hex');

    const OP_ENDIF = '68';
    const SPELL_HEX = '7370656c6c'; // "spell" in hex

    const spellIndex = scriptHex.indexOf(SPELL_HEX);
    if (spellIndex === -1) {
      return null;
    }

    const endIfIndex = scriptHex.lastIndexOf(OP_ENDIF);
    if (endIfIndex === -1 || endIfIndex <= spellIndex) {
      return null;
    }

    let dataStartIndex = spellIndex + SPELL_HEX.length;

    const cborData = extractPushData(scriptHex, dataStartIndex, endIfIndex);

    if (cborData && cborData.length > 0) {
      console.log('Extracted CBOR data hex (first 100 chars):', cborData.toString('hex').substring(0, 100) + '...');
      console.log('CBOR data length:', cborData.length, 'bytes');
      return cborData;
    } else {
      return null;
    }
  } catch (error) {
    console.log(`Error extracting spell from witness script: ${(error as Error).message}`);
    return null;
  }
}

// Dynamically extracts push data from script hex
function extractPushData(scriptHex: string, startIndex: number, endIndex: number): Buffer | null {
  try {
    let currentIndex = startIndex;
    const allData: Buffer[] = [];

    while (currentIndex < endIndex) {
      const opcode = scriptHex.substring(currentIndex, currentIndex + 2);
      const opcodeValue = parseInt(opcode, 16);

      if (opcodeValue >= 1 && opcodeValue <= 75) {
        // OP_PUSHDATA with length 1-75 bytes
        const dataLength = opcodeValue;
        const dataStart = currentIndex + 2;
        const dataEnd = dataStart + (dataLength * 2);

        if (dataEnd <= endIndex) {
          const data = Buffer.from(scriptHex.substring(dataStart, dataEnd), 'hex');
          allData.push(data);
          currentIndex = dataEnd;
        } else {
          break;
        }
      } else if (opcodeValue === 0x4c) {
        // OP_PUSHDATA1: next byte is length
        const lengthByte = scriptHex.substring(currentIndex + 2, currentIndex + 4);
        const dataLength = parseInt(lengthByte, 16);
        const dataStart = currentIndex + 4;
        const dataEnd = dataStart + (dataLength * 2);

        if (dataEnd <= endIndex) {
          const data = Buffer.from(scriptHex.substring(dataStart, dataEnd), 'hex');
          allData.push(data);
          currentIndex = dataEnd;
        } else {
          break;
        }
      } else if (opcodeValue === 0x4d) {
        // OP_PUSHDATA2: next 2 bytes are length (little endian)
        const lengthBytes = scriptHex.substring(currentIndex + 2, currentIndex + 6);
        const lengthHex = lengthBytes.substring(2, 4) + lengthBytes.substring(0, 2);
        const dataLength = parseInt(lengthHex, 16);
        const dataStart = currentIndex + 6;
        const dataEnd = dataStart + (dataLength * 2);

        if (dataEnd <= endIndex) {
          const data = Buffer.from(scriptHex.substring(dataStart, dataEnd), 'hex');
          allData.push(data);
          currentIndex = dataEnd;
        } else {
          break;
        }
      } else if (opcodeValue === 0x4e) {
        // OP_PUSHDATA4: next 4 bytes are length (little endian)
        const lengthBytes = scriptHex.substring(currentIndex + 2, currentIndex + 10);
        // Convert little endian to big endian
        const lengthHex = lengthBytes.substring(6, 8) + lengthBytes.substring(4, 6) +
          lengthBytes.substring(2, 4) + lengthBytes.substring(0, 2);
        const dataLength = parseInt(lengthHex, 16);
        const dataStart = currentIndex + 10;
        const dataEnd = dataStart + (dataLength * 2);

        if (dataEnd <= endIndex) {
          const data = Buffer.from(scriptHex.substring(dataStart, dataEnd), 'hex');
          allData.push(data);
          currentIndex = dataEnd;
        } else {
          break;
        }
      } else {
        // Skip unknown opcodes
        currentIndex += 2;
      }
    }

    if (allData.length > 0) {
      return Buffer.concat(allData);
    }

    return null;
  } catch (error) {
    console.log(`Error in extractPushData: ${(error as Error).message}`);
    return null;
  }
}

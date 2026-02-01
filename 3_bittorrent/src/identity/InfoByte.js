const INFO_BYTES = Buffer.from([0x69, 0x6e, 0x66, 0x6f]); // 'info'

export function getInfoSection(buffer){
    let i = 1;
    while(i<buffer.length){
        if(buffer[i] === 0x65) break;

        const keyMetadata = parseString(buffer, i);

        if (keyMetadata.len === 4) {
            const keyPayload = buffer.slice(keyMetadata.payloadStart, keyMetadata.end);

            if (keyPayload.equals(INFO_BYTES)) {
                const valStart = keyMetadata.end; 
                const valEnd = endSearch(buffer, valStart);

                return {
                    start: valStart,
                    end: valEnd,
                    raw: buffer.slice(valStart, valEnd)
                };
            }
        }

        // If it wasn't info, skip the value and move on
        // We start the next search from the end of the key
        i = endSearch(buffer, keyMetadata.end);
    }
    throw new Error("Info section not found");
}



//helper function
function isDigit(byte){
    return byte >= 0x30 && byte <= 0x39;
}

function DictEnd(buffer, infoStart){
    // console.log('InfoStart: ',infoStart);
    // console.log('InfoStartVal: ', buffer[infoStart]);
    if (buffer[infoStart] !== 0x64) throw new Error('Protocol violation: Dictionary not found in INFO');
    let i = infoStart + 1
    while (true){
        const byte = buffer[i];
        if(byte === 0x65){
            return i + 1;
        }
        if(isDigit(byte)){
            try {
                const stringEnd = skipString(buffer, i);
                i = stringEnd;
            } catch (error) {
                throw new Error(`Protocol Violation: Wrong dictionary key - ${error.message}`);
            }

            try {
                const valueEnd = endSearch(buffer, i); //like decode for info bytes
                i = valueEnd;
            } catch (error) {
                throw new Error(`Protocol Violation: Something went wrong during search - ${error.message}`);
            }
        }else throw new Error('Protocol violation: Mandatory String byte missing!')
    }
}

function endSearch(buffer, offset){
    switch(buffer[offset]){
        case 0x69: return skipInt(buffer,offset);
        case 0x6c: return skipList(buffer,offset);
        case 0x64: return DictEnd(buffer,offset);
        default:{
            if(isDigit(buffer[offset])) return skipString(buffer, offset);
            else throw new Error('Protocol violation: Wrong input at state machine');
        }
    }
}

function parseString(buffer, offset) {
    let i = offset;
    let len = 0;
    while (buffer[i] !== 0x3a) { // Find ':'
        if (i >= buffer.length) throw new Error("Protocol Violation: Unexpected EOF in string length");

        if (!isDigit(buffer[i])) {
            throw new Error(`Protocol Violation: Non-digit byte 0x${buffer[i].toString(16)} in string length at offset ${i}`);
        }
        const digit = buffer[i] - 0x30;
        len = len * 10 + digit;
        i++;
    }

    const payloadStart = i + 1;
    const end = payloadStart + len;

    // Fix #2: Enforce payload bounds
    if (end > buffer.length) {
        throw new Error(`Protocol Violation: String payload (length ${len}) exceeds buffer bounds`);
    }

    return {
        len: len,
        payloadStart: payloadStart,
        end: end
    };
}

// You can keep a simple skipString wrapper for your other functions
function skipString(buffer, offset) {
    return parseString(buffer, offset).end;
}

function skipInt(buffer, offset){
    let i = offset + 1; // skip 'i'
    while (i < buffer.length && buffer[i] !== 0x65) { // Wait for 'e'
        i++;
    }
    if (i >= buffer.length) throw new Error("Protocol Violation: Integer missing 'e' terminator");
    return i + 1;
}

function skipList(buffer , offset){
    let i = offset + 1; //skip l
    while(buffer[i] !== 0x65){
        try {
            const skipVal = endSearch(buffer, i);
            i = skipVal;
        }catch (error) {
            throw new Error(`Protocol Violation: Something list element - ${error.message}`);
        }
    }
    return i + 1;
}




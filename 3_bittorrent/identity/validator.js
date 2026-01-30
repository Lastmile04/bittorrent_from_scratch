import { Buffer } from 'buffer';

// helper function
function isDigit(byte){
    return byte >= 0x30 && byte <= 0x39
}

function Validator_Type(buffer, offset){
    if (offset >= buffer.length) {
        throw new Error(`Unexpected end of input (EOF) at offset ${offset}`);
    }
    switch (buffer[offset]) {
        case 0x69: return valid_Int(buffer, offset);
        case 0x64: return valid_Dict(buffer, offset);
        case 0x6c: return valid_List(buffer, offset);
        default:
            if(isDigit(buffer[offset])) return valid_String(buffer, offset);
            else throw new Error(`Protocol Error: Invalid data type at offset ${offset}`);
    }
}

function valid_Int(buffer, offset){
    let i = offset + 1;
    let digitCount = 0;
    let sign = 1;
    if(buffer[i] === 0x2d){
        sign = -1;
        i++;
    }
    let firstDigit = true;
    let firstDigitWasZero = false;
    let hasDigit = false;

    while(i<buffer.length){
        const byte = buffer[i];
        if(byte === 0x65){
            if(!hasDigit) throw new Error(`Invalid Integer: No integer ${i}` );
            return { nextOffset: i+1}
        }
        if(!isDigit(byte)) throw new Error(`Invalid Integer at offset ${i}`);
        const digit = byte - 0x30;
        if(digit === 0 && firstDigit && sign === -1) throw new Error(`Invalid Integer: Negative Zero at ${i}`);
        if(digit === 0 && firstDigit) firstDigitWasZero = true;
        if(firstDigitWasZero && !firstDigit) throw new Error(`Protocol Violation: Leading zeros at offset ${i}`);
        firstDigit = false;
        hasDigit = true;
        i++;
    }
    throw new Error(`Unexpected end of input (EOF) for integer ${i}`);
}

function valid_String(buffer, offset){
    let i = offset;
    let length = 0;
    let hasLength = false;
    let payloadStart = 0;
    let sawColon = false;
    let firstDigit = true;
    let firstDigitWasZero = false;
    while(i < buffer.length){
        const byte = buffer[i];
        if(isDigit(byte)){
            const digit = byte - 0x30;
            if(firstDigit && digit === 0) firstDigitWasZero = true;
            if(!firstDigit && firstDigitWasZero) throw new Error(`Invalid String: No leading Zeros at ${i}`);
            length = length * 10 + digit;
            hasLength = true;
            firstDigit = false;
            i++;
        } else if(byte === 0x3a){
            sawColon = true;
            if(!hasLength) throw new Error(`Invalid String: Empty length`);
            i++;
            payloadStart = i;
            break;
        } else throw new Error(`Invalid String: Unidentifiable character at ${i}`);
    }
    if(!sawColon) throw new Error(`Unexpected end of input (EOF) for String ${i}`);
    const payloadEnd = length + payloadStart;
    if(buffer.length < payloadEnd){
        throw new Error(`Unexpected end of input (EOF) for string payload at ${i}`);
    }
    const payloadBuffer = buffer.slice(payloadStart, payloadEnd);
    return {
        nextOffset: payloadEnd,
        payloadBuffer  // NEW: return this
    };
}

function valid_List(buffer, offset){
    let i = offset + 1;
    while(i < buffer.length){
        const byte = buffer[i];
        if(byte === 0x65){
            return {nextOffset: i+1 };
        }
        const stat = Validator_Type(buffer, i);
        i = stat.nextOffset;
    }
    throw new Error(`Unexpected end of input (EOF) for List ${i}`);
}

function valid_Dict(buffer, offset){
    let i = offset+1;
    let prevKeyPayload = null;
    while(i<buffer.length){
        const byte = buffer[i];
        if(byte === 0x65){
            return{nextOffset: i+1};
        }
        if(!isDigit(byte)){
            throw new Error(`Invalid dictionary: key must start with digit at ${i}`);
        }
        const keyStart = i;
        const keyValid = valid_String(buffer, i);
        const keyEnd = keyValid.nextOffset;
        const keyPayload = keyValid.payloadBuffer;

        if (prevKeyPayload && Buffer.compare(prevKeyPayload, keyPayload) >= 0) {
            throw new Error(`Invalid dictionary: keys not in lex order at ${keyStart}`);
        }
        prevKeyPayload = keyPayload;
        i = keyEnd;
        if(i>= buffer.length) throw new Error(`Unexpected end of input (EOF) for Dictionary ${i}`);
        const validValue = Validator_Type(buffer, i);
        i = validValue.nextOffset;
    } throw new Error(`Unexpected end of input (EOF) for Dictionary ${i}`);
}

function validateBencode(buffer) {
    const result = Validator_Type(buffer, 0);
    if (result.nextOffset !== buffer.length) {
        throw new Error(`Invalid trailing data at offset ${result.nextOffset}`);
    }
    return true;
}

export { Validator_Type, validateBencode };
import { decode } from "../codec/bencode.js";
export function bytesLeft(info){

    let left = 0 
    const FILES = Buffer.from('files');
    const LENGTH = Buffer.from('length');
    let filesIR;
    let lengthIR;
    
    for(const [keyBuffer, valueIR] of info.value){
        if(keyBuffer.equals(FILES)){
            filesIR = valueIR;
        }
        else if(keyBuffer.equals(LENGTH)){

            lengthIR = valueIR;
        }
    }
    
    if(!filesIR && !lengthIR) throw new Error('Invalid Torrent!')
    if(filesIR){
        if(filesIR.type !== 'List') throw new Error('files must be a List');
        filesIR.value.forEach(dict => {

            if(dict.type !== 'Dictionary') throw new Error('file entry must be a Dictionary');
            for(const [fileKey, fileValIR] of dict.value){
                if(fileKey.equals(LENGTH)){
                    if(fileValIR.type !== 'Integer') throw new Error('file length must be an Integer');
                    left += fileValIR.value;
                }
            }
        });    
    }
    else{
        if(lengthIR.type !== 'Integer') throw new Error('length value must be an Integer');
        left += lengthIR.value;
    }

    return left;
}

// detect if 'files' exists
// if yes → ONLY process files
// else → process length


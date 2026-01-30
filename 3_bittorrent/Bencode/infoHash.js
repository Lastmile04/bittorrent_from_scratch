import crypto from 'crypto';

export function computeInfoHash(infoBytes){
    return crypto.createHash('sha1').update(infoBytes).digest(); //digest(): Buffer(20bytes)
};
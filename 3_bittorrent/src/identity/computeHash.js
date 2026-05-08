import crypto from 'crypto';

export function computeSha1Hash(Buff) {
    return crypto.createHash('sha1').update(Buff).digest(); //digest(): Buffer(20bytes)
};

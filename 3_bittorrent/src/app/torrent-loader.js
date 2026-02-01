import fs from 'fs';
import { decode, encode, ProtocolTypes } from './bencode.js';
import { validateBencode } from './validator.js';
import { getInfoSection } from './InfoByte.js';
import { computeInfoHash } from './infoHash.js';

const buffer = fs.readFileSync('big-buck-bunny.torrent');
let offset = 0;
try {
    validateBencode(buffer); // Add this function in validator.js (see below)
    // const torrentIR = decode(buffer, offset);
    console.log('Torrent validated successfully!');
    const infoSection = getInfoSection(buffer);
    console.log('Info section extracted!');
    console.log('Start offset:', infoSection.start);
    console.log('End offset:', infoSection.end);
    const InfoHash = computeInfoHash(infoSection.raw);
    console.log('Info Hash (hex):', InfoHash.toString('hex'));

} catch (e) {
    console.error('Torrent invalid:', e.message);
    process.exit(1);
}


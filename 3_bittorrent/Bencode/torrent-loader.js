import fs from 'fs';
import { decode, encode, ProtocolTypes } from './bencode.js';

fs.readFile
const buffer = fs.readFileSync('big-buck-bunny.torrent');
let offset = 0;
const decoded_torrent = decode(buffer, offset);
if (decoded_torrent.incomplete) throw new Error('Protocol violation: incomplete torrent file');
if(decoded_torrent.nextOffset !== buffer.length) throw new Error('Protocol violation: Error decoding torrent file')
console.dir(decoded_torrent.value, { depth: null });



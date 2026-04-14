import fs from 'fs';
import { validateBencode } from '../codec/validator.js';
import { getInfoSection } from '../identity/InfoByte.js';
import { computeInfoHash } from '../identity/infoHash.js';
import { decode } from '../codec/bencode.js';
import { getAnnounce } from './torrent-metadata.js';

export function parseTorrentFile(torrentPath) {
  try {
    // Read torrent file
    const buffer = fs.readFileSync(torrentPath);
    
    // Validate bencode structure
    validateBencode(buffer);
    console.log('Torrent validated successfully');
    
    // Extract info section
    const infoSection = getInfoSection(buffer);
    console.log('Info section extracted');
    console.log('Start offset->', infoSection.start);
    console.log('End offset->', infoSection.end);
    
    // Compute info hash
    const infoHash = computeInfoHash(infoSection.raw);
    console.log('Info Hash (hex)->', infoHash.toString('hex'));

    const decodedIR = decode(buffer, 0).value;
    let decodedInfoSection;

    for(let [keyBuffer, valueIR] of decodedIR.value){
        if(keyBuffer.equals(Buffer.from('info'))){
          decodedInfoSection = valueIR;
        }
    }

    const torrentAnnounceList = getAnnounce(decodedIR);
    // const torrentAnnounceList = [['udp://tracker.opentrackr.org:1337', 'udp://tracker.openbittorrent.com:6969', 'udp://open.stealth.si:80']]
    
    // Return important values
    return {
      buffer,           // Full torrent file buffer
      torrentAnnounceList,      // AnnounceUrl extract
      decodedInfoSection,
      infoHash,         // Buffer (20 bytes)
      infoHashHex: infoHash.toString('hex'),  // Hex string for display
      valid: true,
    };
    
  } catch (error) {
    console.error('Failed to parse torrent:', error.message);
    throw error; // Re-throw so caller can handle
  }
}
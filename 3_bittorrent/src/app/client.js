import net from 'net';
import { BitTorrentPeer } from '../transport/BitTorrentPeer.js';
import { Spinner } from '../presentation/spinner.js';

// MVP: return first successful peer  
export async function createClient(list, infoHash, peerId){
    const protocolStr = Buffer.from("BitTorrent protocol");

    // Fix: initialize i = 0
    for(let i = 0; i < list.length; i++){
        const peer = list[i];
        const client = new net.Socket();
        const btPeer = new BitTorrentPeer(client, infoHash, peerId, protocolStr, peer);
        
        // Pass i + 1 for human-friendly "Attempt 1/50"
        const spinner = new Spinner(peer.ip, peer.port, i + 1, list.length);
        

        try{

            spinner.start();

            // Await the handshake verification
            const result = await btPeer.connect();

            // Stop spinner FIRST to clear the line for the next logs
            spinner.stop('success');

            // will add the tick and cross just because i like it
            // Log details underneath the success line
            console.log(`   └─ Peer ID: ${result.remotePeerIdHex}`);
            console.log(`   └─ Leftover: ${result.leftoverBuffer?.length || 0} bytes`);

            return  result;

        } catch (err) {
            spinner.stop('fail');
            // Log the error quietly so it doesn't wreck the UI
            console.error(`      Reason: ${err.message}`); 

            // client.destroy(); 
            continue;
        }
    }

    // If the loop finishes without returning, no peers were successful
    throw new Error("Could not connect to any peers in the list.");
}



//  Currently this approach is sequential, even though in real world it's parallel + promise.race
// NOTE: this design decision is for MVP and will be updated in future iterations
 

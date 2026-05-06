import net from 'net';
import { BitTorrentPeer } from '../transport/BitTorrentPeer.js';
import { Spinner } from '../presentation/spinner.js';
import { Buffer } from 'buffer';

// MVP: return first successful peer  
export async function createClient(list, infoHash, peerId, infoSection) {
    const protocolStr = Buffer.from("BitTorrent protocol");

    // Fix: initialize i = 0
    for (let i = 0; i < list.length; i++) {
        const peer = list[i];
        const client = new net.Socket();

        let pieceLength;
        let pieces;
        for (const [keyBuff, valueIR] of infoSection) {
            if (keyBuff.equals(Buffer.from("pieces"))) pieces = valueIR.value;
            if (keyBuff.equals(Buffer.from("piece length"))) pieceLength = valueIR.value;
        }
        const pieceCount = pieces.length / 20;

        const btPeer = new BitTorrentPeer(client, infoHash, peerId, protocolStr, peer, pieceCount, pieceLength);

        // Pass i + 1 for human-friendly "Attempt 1/50"
        const spinner = new Spinner(peer.ip, peer.port, i + 1, list.length);

        const cleanup = bindPeerToSpinner(btPeer, spinner);

        try {
            // Await the handshake 
            const result = await btPeer.connect();

            cleanup();

            // Stop spinner FIRST to clear the line for the next logs
            return result;

        } catch (err) {
            // console.log("FAIL:", err.type, err.message);
            cleanup();
            client.destroy();

            // client.destroy(); 
            continue;
        }
    }

    // If the loop finishes without returning, no peers were successful
    throw new Error("Could not connect to any peers in the list.");
}



//  Currently this approach is sequential, even though in real world it's parallel + promise.race
// NOTE: this design decision is for MVP and will be updated in future iterations

function bindPeerToSpinner(btPeer, spinner) {
    const onConnecting = () => {
        console.log("CONNECTING EVENT FIRED");
        spinner.onConnecting();
    };
    const onSuccess = () => spinner.onSuccess('success');
    const onFail = (err) => spinner.onFail(err);

    btPeer.on('CONNECTING', onConnecting);
    btPeer.on('HANDSHAKE_SUCCESS', onSuccess);
    btPeer.on('CONNECT_SUCCESS', () => { });
    btPeer.on("CONNECTION_CLOSED", () => { });
    btPeer.on("SOCKET_CLOSED", () => { });

    btPeer.on('ERROR', onFail);
    btPeer.on("PEER_ERROR", onFail);
    btPeer.on("SOCKET_ERROR", onFail);

    return () => {
        btPeer.off('CONNECTING', onConnecting);
        btPeer.off('HANDSHAKE_SUCCESS', onSuccess);
        btPeer.off('ERROR', onFail);
    }
}

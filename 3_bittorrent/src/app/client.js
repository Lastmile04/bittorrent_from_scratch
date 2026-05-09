import net from 'net';
import { BitTorrentPeer } from '../transport/BitTorrentPeer.js';
import { Spinner } from '../presentation/spinner.js';
import { Buffer } from 'buffer';
import { stdout } from 'process';

// MVP: return first successful peer  
export async function createClient(list, peerId, torrentMeta) {
    const protocolStr = Buffer.from("BitTorrent protocol");

    // Fix: initialize i = 0
    for (let i = 0; i < list.length; i++) {
        const peer = list[i];
        const client = new net.Socket();

        const btPeer = new BitTorrentPeer(client, peerId, protocolStr, peer, torrentMeta);

        // Pass i + 1 for human-friendly "Attempt 1/50"
        const spinner = new Spinner(peer.ip, peer.port, i + 1, list.length);

        const cleanup = bindPeerToSpinner(btPeer, spinner);

        try {
            const result = await btPeer.connect();

            cleanup();

            // Stop spinner FIRST to clear the line for the next logs
            return result;

        } catch (err) {
            console.log("FAIL:", err.type, err.message);
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
    const onSuccess = (data) => spinner.onSuccess(data);
    const onHandshakeSuccess = () => spinner.onHandshakeSuccess('success');
    const onFail = (err) => spinner.onFail(err);

    btPeer.on('CONNECTING', onConnecting);
    btPeer.on('HANDSHAKE_SUCCESS', onHandshakeSuccess);

    btPeer.on('CONNECT_SUCCESS', (data) => { console.log(`Peer ${data.peer} connection successsful`) });

    btPeer.on("CONNECTION_CLOSED", (data) => { console.log(`Peer ${data.peer} connection closed`) });

    btPeer.on("SOCKET_CLOSED", (data) => { console.log(`Peer ${data.peer} socket closed`) });

    btPeer.on("BLOCK_RECEIVED", (payload) => {
        process.stdout.write(
            `\nIndex: ${payload.index}
        \nBegin: ${payload.begin}
        \nLength: ${payload.blockLength}`
        )
    });

    btPeer.on("PROGRESS", (data) => {
        process.stdout.write(
            `\n PROGRESS: ${data}`
        )
    });

    btPeer.on("REQUEST_SENT", (payload) => {
        process.stdout.write(
            `\nIndex: ${payload.index}
            \n Begin: ${payload.begin}
            \n Length: ${payload.length}`
        )
    });

    btPeer.on("PEER_UNCHOKE", () => { console.log("Peer Unchoke") });
    btPeer.on("PIECE_DOWNLOAD_SUCCESS", (data) => onSuccess(data));


    btPeer.on('ERROR', onFail);
    btPeer.on("PEER_ERROR", onFail);
    btPeer.on("SOCKET_ERROR", onFail);

    return () => {
        btPeer.off('CONNECTING', onConnecting);
        btPeer.off('HANDSHAKE_SUCCESS', onHandshakeSuccess);
        btPeer.off('ERROR', onFail);
        btPeer.off("PIECE_DOWNLOAD_SUCCESS", onSuccess);
    }
}

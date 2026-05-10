import net from 'net';
import { BitTorrentPeer } from '../transport/BitTorrentPeer.js';
import { Spinner } from '../presentation/spinner.js';
import { Buffer } from 'buffer';


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
    // We map technical events to human-readable "Phases"
    const handleConnecting = () => {
        spinner.start();
        spinner.updatePhase('TCP-Wait');
    };

    const handleHandshake = () => spinner.updatePhase('Handshake');

    const handleUnchoke = () => spinner.updatePhase('Downloading');

    // Progress Bar 
    const handleProgress = (percent) => {
        spinner.updateProgress(percent);
    };

    // Lifecycle & Graveyard 
    const handleSuccess = (data) => {
        spinner.updateProgress(100);
        spinner.stop('success', `Piece ${data.index} verified`);
    };

    const handleError = (err) => {
        // We use err.type if your transport provides it, or just a generic message
        spinner.stop('fail', err.message || 'Unknown Error');
    };

    // Attachment
    btPeer.on('CONNECTING', handleConnecting);
    btPeer.on('HANDSHAKE_SUCCESS', handleHandshake);
    btPeer.on('PEER_UNCHOKE', handleUnchoke);
    btPeer.on('PROGRESS', handleProgress);
    btPeer.on('PIECE_DOWNLOAD_SUCCESS', handleSuccess);
    btPeer.on('ERROR', handleError);
    btPeer.on('SOCKET_ERROR', handleError);

    return () => {
        btPeer.off('CONNECTING', handleConnecting);
        btPeer.off('HANDSHAKE_SUCCESS', handleHandshake);
        btPeer.off('PEER_UNCHOKE', handleUnchoke);
        btPeer.off('PROGRESS', handleProgress);
        btPeer.off('PIECE_DOWNLOAD_SUCCESS', handleSuccess);
        btPeer.off('ERROR', handleError);
        btPeer.off('SOCKET_ERROR', handleError);
    };
}

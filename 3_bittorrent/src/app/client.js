import net from 'net';
import { BitTorrentPeer } from '../transport/BitTorrentPeer.js';
import { Spinner } from '../presentation/spinner.js';
import { Buffer } from 'buffer';


// MVP: return first successful peer  
export async function createClient(list, peerId, torrentMeta) {
    const protocolStr = Buffer.from("BitTorrent protocol");

    // Initialize session stats
    const stats = {
        name: torrentMeta.name.toString(),
        contacted: 0,
        success: 0,
        failed: 0,
        verified: false
    };

    printBanner(stats.name);

    for (let i = 0; i < list.length; i++) {
        stats.contacted++;
        const peer = list[i];
        const client = new net.Socket();
        const btPeer = new BitTorrentPeer(client, peerId, protocolStr, peer, torrentMeta);
        const spinner = new Spinner(peer.ip, peer.port, i + 1, list.length);
        const cleanup = bindPeerToSpinner(btPeer, spinner);

        try {
            const result = await btPeer.connect();

            // 1. Update Stats
            stats.success++;
            stats.verified = true; // Based on your logic verifying the piece
            cleanup();

            // 2. High-Signal Success Message
            console.log(`\n\x1b[32m✅ Piece #0 verified successfully\x1b[0m`);
            console.log(`\x1b[36m🔐 SHA1 integrity check passed\x1b[0m`);

            // 3. Final Summary
            printSummary(stats);
            return result;

        } catch (err) {
            stats.failed++;
            cleanup();
            client.destroy();
            continue;
        }
    }

    // If we get here, everything failed
    printSummary(stats);
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

export function printBanner(torrentName) {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                🚀 NODDY BITTORRENT                       ║
║           BitTorrent Protocol Implementation             ║
╚══════════════════════════════════════════════════════════╝
📍 Target: ${torrentName}
`);
}

export function printSummary(stats) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 DOWNLOAD SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Torrent:            ${stats.name}
👥 Peers Contacted:    ${stats.contacted}
✅ Successful Peers:   ${stats.success}
❌ Failed Peers:       ${stats.failed}
🔐 Integrity Check:    ${stats.verified ? 'PASSED (SHA1)' : 'FAILED'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

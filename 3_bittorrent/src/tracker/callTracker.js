import { udpPeer } from "./udpTracker.js";

export async function callTracker(handler, urlObj, trackerUrl, params) {
    let result;

    if (handler === udpPeer) result = await handler(urlObj.hostname, parseInt(urlObj.port) || 6969, params.infoHash, params.peerId, params.port, params.uploaded, params.downloaded, params.left, params.numwant, params.event);
    else result = await handler(trackerUrl, params.infoHash, params.peerId, params.port, params.uploaded, params.downloaded, params.left, params.numwant, params.event);

    return { peers: result.peers, peerStats: { tracker: trackerUrl, interval: result.interval, leechers: result.leechers, seeders: result.seeders, peerNum: result.peerNum } };

}

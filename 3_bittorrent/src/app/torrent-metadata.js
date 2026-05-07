const KEYS = {
    // main functin keys
    ANNOUNCE: Buffer.from('announce'),
    ANNOUNCE_LIST: Buffer.from('announce-list'),
    INFO: Buffer.from('info'),

    // info section keys
    NAME: Buffer.from('name'),
    PIECES: Buffer.from('pieces'),
    PIECE_LENGTH: Buffer.from('piece length'),
    LENGTH: Buffer.from('length'),
    FILES: Buffer.from('files'),
    PATH: Buffer.from('path')
};

export function torrentMetadataExtraction(decodedRootIR) {
    if (decodedRootIR.type !== 'Dictionary') throw new Error('Expected Dictionary at root');

    const pairs = decodedRootIR.value;
    let announceListVal,
        infoSectionVal;

    for (const [keyBuffer, valueIR] of pairs) {

        if (keyBuffer.equals(KEYS.INFO)) {
            if (valueIR.type !== "Dictionary") throw new Error('infoSection value must be a dictionary');
            infoSectionVal = valueIR.value;
        }

        if (keyBuffer.equals(KEYS.ANNOUNCE_LIST)) {
            if (valueIR.type !== 'List') throw new Error('announce-list value must be a List');
            announceListVal = { value: valueIR.value, type: 'List' };
        }
        if (keyBuffer.equals(KEYS.ANNOUNCE)) {
            if (valueIR.type !== 'String') throw new Error('announce value must be string');
            announceListVal = { value: valueIR.value, type: 'String' };
        }

    }

    const tiers = extractTiers(announceListVal);
    const infoMetadata = extractInfoMeta(infoSectionVal);

    return {
        announceList: tiers,
        ...infoMetadata
    }
}

export function extractTiers(announceVal) {
    let res = [];
    const { value, type } = announceVal;

    // if announce key it contains a single string value
    if (type === 'String') {
        res.push(value.toString('utf-8'));
        return [res];
    }

    // announce value contains tiers
    const tiers = value;

    // could use for each but normal loop seems much more understandable
    for (const tier of tiers) {
        const trackerList = [];
        if (tier.type !== 'List') throw new Error("Tier must be lists");
        for (const tracker of tier.value) {
            if (tracker.type !== 'String') throw new Error(" Trackers must be string");
            trackerList.push(tracker.value.toString('utf-8'));
        }
        res.push(trackerList);
    }

    return res;
}

export function extractInfoMeta(info) {
    let name,
        pieceLength,
        lastPieceLength,
        pieceHashes,
        pieceCount,
        totalLength = 0,
        multiFileIR,
        singleFileIR;


    for (const [keyBuff, valueIR] of info) {

        if (keyBuff.equals(KEYS.PIECES)) pieceHashes = valueIR.value;
        if (keyBuff.equals(KEYS.PIECE_LENGTH)) pieceLength = valueIR.value;
        if (keyBuff.equals(KEYS.NAME)) name = valueIR.value.toString("utf-8");

        if (keyBuff.equals(KEYS.FILES)) multiFileIR = valueIR;
        if (keyBuff.equals(KEYS.LENGTH)) singleFileIR = valueIR;
    }

    if (
        (!singleFileIR && !multiFileIR) ||
        (!name) ||
        (!Number.isInteger(pieceLength) || pieceLength <= 0) ||
        (!pieceHashes)
    ) throw new Error('Invalid Torrent!');

    if (multiFileIR) {
        if (multiFileIR.type !== 'List') throw new Error('files must be a List');
        for (const file of multiFileIR.value) {

            if (file.type !== 'Dictionary') throw new Error('file entry must be a Dictionary');

            for (const [fileKey, fileValIR] of file.value) {

                if (fileKey.equals(KEYS.LENGTH)) {

                    if (fileValIR.type !== 'Integer') throw new Error('file length must be an Integer');
                    if (Number.isInteger(fileValIR.value) && fileValIR.value > 0) totalLength += fileValIR.value;
                    else throw new Error(' Malformed Torrent | Invalid Length');
                }

            }
        }
    } else {
        if (singleFileIR.type !== 'Integer') throw new Error('length value must be an Integer');
        totalLength += singleFileIR.value;
    }

    // since SHA1 hash is of 20 bytes so we can validate the torrent by checking if remainder is 0
    if (pieceHashes.length % 20 !== 0 || pieceHashes.length === 0) throw new Error('Invalid piece Hash length | Malformed torrent');
    pieceCount = pieceHashes.length / 20;

    pieceHashes = splitPieceHashes(pieceHashes);

    // NOTE: usually the lastPieceLength caluculation is not stored instead a helper function is implemented to make it more easily accessible but for MVP we're storing it for now 
    lastPieceLength = (totalLength % pieceLength === 0) ? pieceLength : (totalLength % pieceLength);


    return {
        name,
        pieceLength,
        lastPieceLength,
        pieceHashes,
        pieceCount,
        totalLength,
        isMultiFile: Boolean(multiFileIR)
    }


}

function splitPieceHashes(buf) {
    const piecesArr = [];
    for (let offset = 0; offset < buf.length; offset += 20) {
        piecesArr.push(buf.subarray(offset, offset + 20));
    }
    return piecesArr;
}



export function getAnnounce(decodedIR){
    if(decodedIR.type !== 'Dictionary') throw new Error('Expected Dictionary at root');

    const pairs = decodedIR.value; 

    for(const [keyBuffer, valueIR] of pairs){
        if(keyBuffer.equals(Buffer.from('announce-list'))){
            if(valueIR.type !== 'List') throw new Error('announce-list value must be a List');

            let tiers = []
            valueIR.value.forEach(tierIR => {
                if (tierIR.type !== 'List') throw new Error('Tier must be List');

                const trackersInTier = [];
                tierIR.value.forEach(urlIR =>{
                    if(urlIR.type !== 'String') throw new Error('URl must be String');
                    trackersInTier.push(urlIR.value.toString('utf-8'));
                });
                tiers.push(trackersInTier);
            });
            return tiers;
        }

        else if(keyBuffer.equals(Buffer.from('announce'))){
            if(valueIR.type !== 'String') throw new Error('announce value must be a string');

            return [[valueIR.value.toString('utf-8')]];
        }
    }
    throw new Error('No announce URL found in torrent file');
}


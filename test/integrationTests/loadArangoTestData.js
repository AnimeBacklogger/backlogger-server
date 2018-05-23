const initData = {
    verts: {
        users: [
            {
                name: "Chrolo"
            },
            {
                name: "Begna112"
            },
            {
                name: "Goshi"
            }
        ],
        shows: [
            {
                "name": "Nichijou",
                "malAnimeId": 10165,
                "malUrl": "https://myanimelist.net/anime/10165/Nichijou"    //you can get away with just https://myanimelist.net/anime/10165
            },
            {
                "name": "Punch Line",
                "malAnimeId": 28617,
                "malUrl": ""
            },
            {
                "name": "Yuru Yuri",
                "malAnimeId": 10495
            },
            {
                "name": "Darling in the FranXX",
                "malAnimeId": 35849
            }
        ],
        recommendations: [
            {   //Chrolo rec of Nichijou to Begna112
                score: 10,
                comment: "It's really sugoi Oniichan"
            },
            {   //Chrolo rec of Nichijou to Goshi
                score: 10,
                comment: "It's really sugoi Oniichan"
            },
            {   //Begna112 rec of Darling in the Franxx to Goshi
                score: 8,
                comment: "I want someone else to think it's good"
            }
        ],
        authInformation: [
            {   //Auth info for Chrolo
                hash: "$2a$08$ySh3TxZ7mX0J2V.mr2RrF.m7VLnqFmgHfX9cDSGwndonQ8XrjkvE."    //password123
            },
            {   //Auth info for Goshi
                hash: "$2a$08$ySh3TxZ7mX0J2V.mr2RrF.m7VLnqFmgHfX9cDSGwndonQ8XrjkvE."
            }
        ]
    },
    edges: {
        recommendationTo: [
            {
                //we'll backfill the field into any objects we process.
                _to: "DATA.verts.users[1]",   // Begna112  
                _from: "DATA.verts.recommendations[0]"
            },
            {
                //we'll backfill the field into any objects we process.
                _to: "DATA.verts.users[2]",   // Goshi  
                _from: "DATA.verts.recommendations[1]"
            },
            {
                _to: "DATA.verts.users[2]",   // Goshi  
                _from: "DATA.verts.recommendations[2]"
            }
        ],
        recommendationFrom: [
            {
                _to: "DATA.verts.users[0]",   // Chrolo  
                _from: "DATA.verts.recommendations[0]"
            },
            {
                _to: "DATA.verts.users[0]",   // Chrolo  
                _from: "DATA.verts.recommendations[1]"
            },
            {
                _to: "DATA.verts.users[1]",   // Begna112  
                _from: "DATA.verts.recommendations[2]"
            }
        ],
        recommendationFor: [
            {
                _to: "DATA.verts.shows[0]",   // Nichijou  
                _from: "DATA.verts.recommendations[0]"
            },
            {
                _to: "DATA.verts.shows[0]",   // Nichijou  
                _from: "DATA.verts.recommendations[1]"
            },
            {
                _to: "DATA.verts.shows[3]",   // Darling in the Franxx  
                _from: "DATA.verts.recommendations[2]"
            }
        ],
        friendsWith: [
            {
                _to: "DATA.verts.users[0]",   // Chrolo
                _from: "DATA.verts.users[1]"  // Begna112
            },
            {
                _to: "DATA.verts.users[2]",   // Goshi
                _from: "DATA.verts.users[1]"  // Begna112
            }
        ],
        hasInBacklog: [
            {
                _from: "DATA.verts.users[0]", // user: Chrolo
                _to: "DATA.verts.shows[1]",    // anime: Punchline
                personalScore: 8
            },
            {
                _from: "DATA.verts.users[2]", // user: Goshi
                _to: "DATA.verts.shows[0]",    // anime: Nichijou
                personalScore: 10
            },
            {
                _from: "DATA.verts.users[2]", // user: Goshi
                _to: "DATA.verts.shows[1]"    // anime: Punchline
                //Personal score not set.
            }
        ],
        userAuth: [
            {
                _from: "DATA.verts.users[0]", // user: Chrolo
                _to: "DATA.verts.authInformation[0]"
            },
            {
                _from: "DATA.verts.users[2]", // user: Goshi
                _to: "DATA.verts.authInformation[1]"
            }
        ]
    }
};

const { Database } = require('arangojs');
const DATABASE_CONFIG = require('../../src/data/db/config');

const db = (new Database({
    url: `http://${DATABASE_CONFIG.host}:8529`
})).useDatabase(DATABASE_CONFIG.dbName);

// A place to store the ids
const DATA = {verts: {}, edges: {}};
//Lets add the verts first
Promise.all(Object.keys(initData.verts).map(collectionName => {
    const verts = initData.verts[collectionName];
    const collection = db.collection(collectionName);
    DATA.verts[collectionName] = [];
    return collection.truncate().then(() => Promise.all(
        verts.map((row, index) => collection.save(row).then(x => {DATA.verts[collectionName][index] = x._id;}))
    ));
})).then(() => {
    //Add the edges
    return Promise.all(Object.keys(initData.edges).map(collectionName => {
        const edges = initData.edges[collectionName];
        const edgeCollection = db.collection(collectionName);
        DATA.edges[collectionName] = [];
        return edgeCollection.truncate().then(() => Promise.all(edges.map(row => {
            row._from = eval(row._from);
            row._to = eval(row._to);
            console.log(`Loading '${JSON.stringify(row)}' from '${row._from}' to '${row._to}' into '${collectionName}'`);
            return edgeCollection.save(row).then(x => DATA.edges[collectionName].push(x._id));
        })));
    }));
}).then(() => {
    console.log(JSON.stringify(DATA, null, '  '));
}).catch(err => {
    console.log('-------'.padStart(err.message.length, '-'));
    console.error('ERROR: ', err.message);
    console.log('-------'.padStart(err.message.length, '-'));
    console.log('Processed results:', JSON.stringify(DATA, null, '  '));
});
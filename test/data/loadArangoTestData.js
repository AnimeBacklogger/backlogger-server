

const initData = {
    verts: {
        users: [
            {
                name: 'Chrolo'
            },
            {
                name: 'Begna112'
            },
            {
                name: 'Goshi'
            },
            {
                name: 'emptyPasswordUser'
            }
        ],
        shows: [
            {
                name: 'Nichijou',
                malAnimeId: 10165,
                malUrl: 'https://myanimelist.net/anime/10165/Nichijou'    // you can get away with just https://myanimelist.net/anime/10165
            },
            {
                name: 'Punch Line',
                malAnimeId: 28617,
                malUrl: ''
            },
            {
                name: 'Yuru Yuri',
                malAnimeId: 10495
            },
            {
                name: 'Darling in the FranXX',
                malAnimeId: 35849
            }
        ],
        recommendations: [
            {   // Chrolo rec of Nichijou to Begna112
                score: 10,
                comment: "It's really sugoi Oniichan"
            },
            {   // Chrolo rec of Nichijou to Goshi
                score: 10,
                comment: "It's really sugoi Oniichan"
            },
            {   // Begna112 rec of Darling in the Franxx to Goshi
                score: 8,
                comment: "I want someone else to think it's good"
            }
        ],
        authInformation: [
            {   // Auth info for Chrolo
                hash: '$2a$04$qhaM/V590g0OkDr1WPXNeuJcf/adDsN/WYg2J8y4LELbI5ynQfoxG'    // 'password123', 1 round
            },
            {   // Auth info for Begna112
                hash: '$2a$04$qhaM/V590g0OkDr1WPXNeuJcf/adDsN/WYg2J8y4LELbI5ynQfoxG'
            },
            {   // Auth info for Goshi
                hash: '$2a$04$qhaM/V590g0OkDr1WPXNeuJcf/adDsN/WYg2J8y4LELbI5ynQfoxG'
            },
            {}   // Auth info for emptyPasswordUser
        ]
    },
    edges: {
        recommendationTo: [
            {
                // we'll backfill the field into any objects we process.
                _to: 'DATA.verts.users[1]',   // Begna112
                _from: 'DATA.verts.recommendations[0]'
            },
            {
                // we'll backfill the field into any objects we process.
                _to: 'DATA.verts.users[2]',   // Goshi
                _from: 'DATA.verts.recommendations[1]'
            },
            {
                _to: 'DATA.verts.users[2]',   // Goshi
                _from: 'DATA.verts.recommendations[2]'
            }
        ],
        recommendationFrom: [
            {
                _to: 'DATA.verts.users[0]',   // Chrolo
                _from: 'DATA.verts.recommendations[0]'
            },
            {
                _to: 'DATA.verts.users[0]',   // Chrolo
                _from: 'DATA.verts.recommendations[1]'
            },
            {
                _to: 'DATA.verts.users[1]',   // Begna112
                _from: 'DATA.verts.recommendations[2]'
            }
        ],
        recommendationFor: [
            {
                _to: 'DATA.verts.shows[0]',   // Nichijou
                _from: 'DATA.verts.recommendations[0]'
            },
            {
                _to: 'DATA.verts.shows[0]',   // Nichijou
                _from: 'DATA.verts.recommendations[1]'
            },
            {
                _to: 'DATA.verts.shows[3]',   // Darling in the Franxx
                _from: 'DATA.verts.recommendations[2]'
            }
        ],
        friendsWith: [
            {
                _to: 'DATA.verts.users[0]',   // Chrolo
                _from: 'DATA.verts.users[1]'  // Begna112
            },
            {
                _to: 'DATA.verts.users[2]',   // Goshi
                _from: 'DATA.verts.users[1]'  // Begna112
            }
        ],
        hasInBacklog: [
            {
                _from: 'DATA.verts.users[0]', // user: Chrolo
                _to: 'DATA.verts.shows[1]',    // anime: Punchline
                personalScore: 8
            },
            {
                _from: 'DATA.verts.users[2]', // user: Goshi
                _to: 'DATA.verts.shows[0]',    // anime: Nichijou
                personalScore: 10
            },
            {
                _from: 'DATA.verts.users[2]', // user: Goshi
                _to: 'DATA.verts.shows[1]'    // anime: Punchline
                // Personal score not set.
            }
        ],
        userAuth: [
            {
                _from: 'DATA.verts.users[0]', // user: Chrolo
                _to: 'DATA.verts.authInformation[0]'
            },
            {
                _from: 'DATA.verts.users[1]', // user: Begna112
                _to: 'DATA.verts.authInformation[1]'
            },
            {
                _from: 'DATA.verts.users[2]', // user: Goshi
                _to: 'DATA.verts.authInformation[2]'
            },
            {
                _from: 'DATA.verts.users[3]', // user: emptyPasswordUser
                _to: 'DATA.verts.authInformation[3]'
            }
        ]
    }
};

module.exports = db => {
    // A place to store the ids
    const DATA = { verts: {}, edges: {} };
    // Lets add the verts first
    return Promise.all(Object.keys(initData.verts).map(collectionName => {
        const verts = initData.verts[collectionName];
        const collection = db.collection(collectionName);
        DATA.verts[collectionName] = [];
        return collection.truncate().then(() => Promise.all(
            verts.map((row, index) => collection.save(row).then(x => { DATA.verts[collectionName][index] = x._id; }))
        ));
    })).then(() =>
        // Add the edges
        Promise.all(Object.keys(initData.edges).map(collectionName => {
            const edges = initData.edges[collectionName];
            const edgeCollection = db.collection(collectionName);
            DATA.edges[collectionName] = [];
            return edgeCollection.truncate().then(() => Promise.all(edges.map(row => {
                /* eslint-disable no-param-reassign, no-eval */ // eval is evil, but i'm not writing an object path parser, nor do I want to import lodash
                row._from = eval(row._from);
                row._to = eval(row._to);
                /* eslint-enable no-param-reassign */
                return edgeCollection.save(row).then(x => DATA.edges[collectionName].push(x._id));
            })));
        }))
    ).then(() => DATA);
};

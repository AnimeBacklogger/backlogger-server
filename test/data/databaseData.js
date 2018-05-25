/**
 * This is a wrapper so that stubs can easily implement the `cursor` class wrapper for
 * results from `arangoDb.query()`
 * @param {Object} data the data to be returned by the query
 * @returns {Promise} A promise of a cursor object that will return the supplied data.
 */
module.exports.cursorWrapper = (data) => Promise.resolve({
    all: () => data
});

module.exports.getShowsResult = () => [
    {
        "show": {
            "_key": "21043",
            "_id": "shows/21043",
            "_rev": "_W2huzfS--_",
            "name": "Nichijou",
            "malAnimeId": 10165,
            "malUrl": "https://myanimelist.net/anime/10165/Nichijou"
        },
        "edge": {
            "_key": "21163",
            "_id": "hasInBacklog/21163",
            "_from": "users/21070",
            "_to": "shows/21043",
            "_rev": "_W2huzha--_",
            "personalScore": 10
        }
    },
    {
        "show": {
            "_key": "21047",
            "_id": "shows/21047",
            "_rev": "_W2huzfW--_",
            "name": "Punch Line",
            "malAnimeId": 28617,
            "malUrl": ""
        },
        "edge": {
            "_key": "21166",
            "_id": "hasInBacklog/21166",
            "_from": "users/21070",
            "_to": "shows/21047",
            "_rev": "_W2huzhe--_"
        }
    }
];
module.exports.getRecommendationsResult = () => [
    {
        "rec": {
            "_key": "21077",
            "_id": "recommendations/21077",
            "_rev": "_W2huzf2--_",
            "score": 10,
            "comment": "It's really sugoi Oniichan"
        },
        "edge": {
            "_key": "21143",
            "_id": "recommendationTo/21143",
            "_from": "recommendations/21077",
            "_to": "users/21070",
            "_rev": "_W2huzhK--D"
        },
        "show": {
            "_key": "21043",
            "_id": "shows/21043",
            "_rev": "_W2huzfS--_",
            "name": "Nichijou",
            "malAnimeId": 10165,
            "malUrl": "https://myanimelist.net/anime/10165/Nichijou"
        },
        "user": {
            "_key": "21063",
            "_id": "users/21063",
            "_rev": "_W2huzfq--B",
            "name": "Chrolo"
        }
    },
    {
        "rec": {
            "_key": "21080",
            "_id": "recommendations/21080",
            "_rev": "_W2huzg---_",
            "score": 8,
            "comment": "I want someone else to think it's good"
        },
        "edge": {
            "_key": "21146",
            "_id": "recommendationTo/21146",
            "_from": "recommendations/21080",
            "_to": "users/21070",
            "_rev": "_W2huzhS--_"
        },
        "show": {
            "_key": "21053",
            "_id": "shows/21053",
            "_rev": "_W2huzfm--_",
            "name": "Darling in the FranXX",
            "malAnimeId": 35849
        },
        "user": {
            "_key": "21067",
            "_id": "users/21067",
            "_rev": "_W2huzfu--_",
            "name": "Begna112"
        }
    }
];

module.exports.getAuthResult = () => [
    {
        "authInfo": {
            "_key": "21056",
            "_id": "authInformation/21056",
            "_rev": "_W2huzfm--B",
            "hash": "$2a$08$ySh3TxZ7mX0J2V.mr2RrF.m7VLnqFmgHfX9cDSGwndonQ8XrjkvE."
        },
        "edge": {
            "_key": "21169",
            "_id": "userAuth/21169",
            "_from": "users/21063",
            "_to": "authInformation/21056",
            "_rev": "_W2huzhi--_"
        }
    }
];

module.exports.getUserResult = () => [
    {
        "user": {
            "_key": "21063",
            "_id": "users/21063",
            "_rev": "_W2huzfq--B",
            "name": "Chrolo"
        },
        "friends": [
            {
                "friendInfo": {
                    "_key": "21067",
                    "_id": "users/21067",
                    "_rev": "_W2huzfu--_",
                    "name": "Begna112"
                },
                "edge": {
                    "_key": "21132",
                    "_id": "friendsWith/21132",
                    "_from": "users/21067",
                    "_to": "users/21063",
                    "_rev": "_W2huzhC--_"
                }
            }
        ],
        "backlog": [
            {
                "show": {
                    "_key": "21047",
                    "_id": "shows/21047",
                    "_rev": "_W2huzfW--_",
                    "name": "Punch Line",
                    "malAnimeId": 28617,
                    "malUrl": ""
                },
                "edge": {
                    "_key": "21159",
                    "_id": "hasInBacklog/21159",
                    "_from": "users/21063",
                    "_to": "shows/21047",
                    "_rev": "_W2huzhW--B",
                    "personalScore": 8
                }
            }
        ],
        "recommendations": []
    }
];
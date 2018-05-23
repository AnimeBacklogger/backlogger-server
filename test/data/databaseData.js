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

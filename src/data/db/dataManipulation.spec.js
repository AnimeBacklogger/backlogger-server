/* globals describe it*/
const {expect} = require('chai');
const uut = require('./dataManipulation');
const dbShowsResult = [
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
const dbRecResult = [
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

describe('src/data/db/dataManipulation', () => {

    describe('flattenBacklogData()', () => {
        it('takes the results of a backlog db query and returns a backlog', () => {
            const expected = [
                {
                    animeName: "Punch Line",
                    malAnimeId: 28617,
                    recommendations: [],
                    malUrl: ""
                },
                {
                    animeName: "Nichijou",
                    malAnimeId: 10165,
                    malUrl: "https://myanimelist.net/anime/10165/Nichijou",
                    personalScore: 10,
                    recommendations: []
                }
            ];

            expect(uut.flattenBacklogData(dbShowsResult)).to.have.deep.members(expected);
        });
    });

    describe('flattenBacklogAndRecommendations()', () => {

        it('combines a collection of shows and of recommendations into the default `backlog` data format', () => {
            const expected = [
                {
                    animeName: "Punch Line",
                    malAnimeId: 28617,
                    recommendations: [],
                    malUrl: ""
                },
                {
                    animeName: "Nichijou",
                    malAnimeId: 10165,
                    malUrl: "https://myanimelist.net/anime/10165/Nichijou",
                    personalScore: 10,
                    recommendations: [
                        {
                            name: "Chrolo",
                            score: 10,
                            comment: "It's really sugoi Oniichan"
                        }
                    ]
                },
                {
                    animeName: "Darling in the FranXX",
                    malAnimeId: 35849,
                    recommendations: [
                        {
                            name: 'Begna112',
                            score: 8,
                            comment: "I want someone else to think it's good"
                        }
                    ]
                }
            ];
            expect(uut.flattenBacklogAndRecommendations(dbShowsResult, dbRecResult)).to.have.deep.members(expected);
        });

    });

    describe('filterDbFields()', () => {
        it('filters out any object keys that begin with `_` character', () => {
            const expected = {
                test: ['array', 3, {bob: 4}],
                data: 'this is a string'
            };
            const input = {
                test: ['array', 3, {bob: 4}],
                _id: 3,
                data: 'this is a string'

            };
            expect(uut.filterDbFields(input)).to.deep.equal(expected);
        });

        it('works deeply on objects', () => {
            const expected = {
                test: ['array', 3, {bob: 4}, {}],
                data: 'this is a string',
                extra: {
                    pop: 3
                }
            };
            const input = {
                test: ['array', 3, {bob: 4}, {_remove: 'test'}],
                _id: 3,
                data: 'this is a string',
                extra: {
                    _class: 'remove',
                    pop: 3
                }

            };
            expect(uut.filterDbFields(input)).to.deep.equal(expected);
        });

        it('works deeply on arays', () => {
            const input = [
                3,
                {bob: 'test', show: 'Nichijou', _id: 321},
                '_test',
                [
                    {_id: 987},
                    {_key: 987, data: 'bob'}
                ]
            ];
            const expected = [
                3,
                {bob: 'test', show: 'Nichijou'},
                '_test',
                [
                    {},
                    {data: 'bob'}
                ]
            ];
            expect(uut.filterDbFields(input)).to.deep.equal(expected);

        });

        it('will return the given data if it is not an object or array', () => {
            [3, 'string', true].forEach(input => {
                expect(uut.filterDbFields(input)).to.deep.equal(input);
            });
        });
    });
});

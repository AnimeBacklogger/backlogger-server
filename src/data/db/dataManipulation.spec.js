

/* globals describe it */
const { expect } = require('chai');
const uut = require('./dataManipulation');
const databaseTestData = require('../../../test/data/databaseData');

describe('src/data/db/dataManipulation', () => {
    describe('flattenBacklogData()', () => {
        it('takes the results of a backlog db query and returns a backlog', () => {
            const expected = [
                {
                    animeName: 'Punch Line',
                    malAnimeId: 28617,
                    recommendations: [],
                    malUrl: ''
                },
                {
                    animeName: 'Nichijou',
                    malAnimeId: 10165,
                    malUrl: 'https://myanimelist.net/anime/10165/Nichijou',
                    personalScore: 10,
                    recommendations: []
                }
            ];

            expect(uut.flattenBacklogData(databaseTestData.getShowsResult())).to.have.deep.members(expected);
        });
    });

    describe('flattenBacklogAndRecommendations()', () => {
        it('combines a collection of shows and of recommendations into the default `backlog` data format', () => {
            const expected = [
                {
                    animeName: 'Punch Line',
                    malAnimeId: 28617,
                    recommendations: [],
                    malUrl: ''
                },
                {
                    animeName: 'Nichijou',
                    malAnimeId: 10165,
                    malUrl: 'https://myanimelist.net/anime/10165/Nichijou',
                    personalScore: 10,
                    recommendations: [
                        {
                            name: 'Chrolo',
                            score: 10,
                            comment: "It's really sugoi Oniichan"
                        }
                    ]
                },
                {
                    animeName: 'Darling in the FranXX',
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
            const actual = uut.flattenBacklogAndRecommendations(databaseTestData.getShowsResult(), databaseTestData.getRecommendationsResult());
            expect(actual).to.have.deep.members(expected);
        });
    });

    describe('filterDbFields()', () => {
        it('filters out any object keys that begin with `_` character', () => {
            const expected = {
                test: ['array', 3, { bob: 4 }],
                data: 'this is a string'
            };
            const input = {
                test: ['array', 3, { bob: 4 }],
                _id: 3,
                data: 'this is a string'

            };
            expect(uut.filterDbFields(input)).to.deep.equal(expected);
        });

        it('works deeply on objects', () => {
            const expected = {
                test: ['array', 3, { bob: 4 }, {}],
                data: 'this is a string',
                extra: {
                    pop: 3
                }
            };
            const input = {
                test: ['array', 3, { bob: 4 }, { _remove: 'test' }],
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
                { bob: 'test', show: 'Nichijou', _id: 321 },
                '_test',
                [
                    { _id: 987 },
                    { _key: 987, data: 'bob' }
                ]
            ];
            const expected = [
                3,
                { bob: 'test', show: 'Nichijou' },
                '_test',
                [
                    {},
                    { data: 'bob' }
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

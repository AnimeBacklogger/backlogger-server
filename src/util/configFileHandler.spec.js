

/* globals describe it */
const configFileHandler = require('./configFileHandler');
const { expect } = require('chai');

describe('configFileHandler', () => {
    describe('minimiseConfig()', () => {
        it('will return an empty object if all default settings are used', () => {
            const actual = configFileHandler.minimiseConfig(configFileHandler.getDefaultConfig());
            expect(actual).to.deep.equal({});
        });
        it('keep any keys not known to the default config', () => {
            const input = {
                some: 'random',
                other: ['keys', 'and', 'such'],
                arango: {
                    extra: 'data'
                }
            };
            const expected = {
                some: 'random',
                other: ['keys', 'and', 'such'],
                arango: {
                    extra: 'data'
                }
            };
            const actual = configFileHandler.minimiseConfig(input);
            expect(actual).to.deep.equal(expected);
        });
        it('keeps any settings that aren\'t set as their defaults', () => {
            const input = {
                arango: {
                    host: 'localhost',  // this is default
                    user: 'bob'         // this is NOT default
                }
            };
            const expected = {
                arango: {
                    user: 'bob'
                }
            };
            const actual = configFileHandler.minimiseConfig(input);
            expect(actual).to.deep.equal(expected);
        });
    });
    describe('getConfig', () => {
        it('returns a fresh copy of the config (not a pointer to the original)', () => {
            const one = configFileHandler.getConfig();
            const two = configFileHandler.getConfig();

            expect(one, 'The objects should be deep equal').to.deep.equal(two);
            expect(one, 'The objects shouldn\'t be the same object').to.not.equal(two);
        });
    });
});

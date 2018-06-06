'use strict';

/* globals describe it beforeEach */
/* eslint max-lines: "off" */ // disable max lines because it's a test file

// Load modules
const { expect } = require('chai');
const shows = require('../../src/data/shows');
const { NonUniqueShowError } = require('../../src/data/dataErrors');
const { rand } = require('../utils');
const { db } = require('./beforeAll');
const { aql } = require('arangojs');


describe('/data/shows.js', () => {
    describe('checkIfShowExistsByName()', () => {
        it('returns true of the show exists', () => shows.checkIfShowExistsByName('Nichijou').then(res => {
            expect(res).to.be.true; // eslint-disable-line no-unused-expressions
        }));

        it('returns the show ID if 2nd arg is true and show exists', async () => {
            const showName = 'Nichijou';
            const showId = await db.query(aql`FOR s IN shows FILTER s.name == ${showName} return s`).then(c => c.all()).then(([x]) => x._id);
            return shows.checkIfShowExistsByName(showName, true).then(res => {
                expect(res).to.equal(showId);
            });
        });

        it('returns false if the show does not exist', () => {
            const randomName = rand.getRandAlphaNumChars(8);
            return shows.checkIfShowExistsByName(randomName).then(res => {
                expect(res, `Found a show named '${randomName}'`).to.be.false; // eslint-disable-line no-unused-expressions
            });
        });
    });

    describe('addShowToDatabase()', () => {
        let newShowName;
        beforeEach(async () => {
            if (newShowName) {
                /* // TODO: clear shows from the database
                await db.collection('show').
                / */
                console.log(`Show '${newShowName}' has not been cleared from the database`);
                //* /
            }
            newShowName = `NewShow_${rand.getRandAlphaNumChars()}`;
        });

        it('rejects with a `NonUniqueShow` error if show exists on the database', () => {
            const data = { name: 'Nichijou' };
            return shows.addShowToDatabase(data).then(() => Promise.reject(new Error('Expected call to throw `NonUniqueShow` error')), err => {
                expect(err).to.be.instanceOf(NonUniqueShowError);
            });
        });

        it('saves to the `shows` collection', () => {
            const data = {
                name: newShowName,
                altNames: [
                    { type: 'nickname', name: 'nick' }
                ]
            };

            return shows.addShowToDatabase(data).then(async () => {
                // Check item exists in database:
                const dbRes = await db.query(aql`FOR s in shows FILTER s.name==${data.name} RETURN s`).then(c => c.all());
                expect(dbRes.length, `Expected 1 result for show ${data.name}, found ${dbRes.length}`).to.equal(1);
                Object.keys(data).forEach(key => {
                    expect(dbRes[0][key]).to.deep.equal(data[key]);
                });
            });
        });
    });
});

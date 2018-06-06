'use strict';

/* globals describe it beforeEach */
/* eslint max-lines: "off" */ // disable max lines because it's a test file
// Set process env for less bcrypt rounds
process.env.BCRYPT_ROUNDS = 1;    // eslint-disable-line no-process-env

// Load modules
const { expect } = require('chai');
const proxyquire = require('proxyquire');

const dbStubs = {};
const uut = proxyquire('./shows', {
    './db': dbStubs
});
const { NonUniqueShowError } = require('./dataErrors');
const { Spy } = require('../../test/utils');
const databaseTestData = require('../../test/data/databaseData');

describe('/data/shows.js', () => {
    it('exports the expected methods', () => {
        const expectedMethods = [
            'addShowToDatabase',
            'checkIfShowExistsByName'
        ];
        expect(Object.keys(uut)).to.have.members(expectedMethods);
    });

    describe('checkIfShowExistsByName()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ _id: 3 }]));
        });

        it('returns a promise', () => {
            expect(uut.checkIfShowExistsByName('test').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('returns true of the show exists', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ _id: 3 }]));
            return uut.checkIfShowExistsByName('test').then(res => {
                expect(res).to.be.true; // eslint-disable-line no-unused-expressions
            });
        });

        it('returns the show ID if 2nd arg is true and show exists', () => {
            const testId = 5;
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ _id: testId }]));
            return uut.checkIfShowExistsByName('test', true).then(res => {
                expect(res).to.equal(testId);
            });
        });

        it('returns false if the show does not exist', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));
            return uut.checkIfShowExistsByName('test').then(res => {
                expect(res).to.be.false; // eslint-disable-line no-unused-expressions
            });
        });
    });

    describe('addShowToDatabase()', () => {
        beforeEach(() => {
            dbStubs.collection = () => ({ save: () => Promise.resolve(true) });
            // Stub no show existing:
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));
        });

        it('returns a promise', () => {
            expect(uut.addShowToDatabase('test1').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('rejects with a `NonUniqueShow` error if show exists on the database', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ _id: 1 }]));
            const data = { name: 'exists' };
            return uut.addShowToDatabase(data).then(() => Promise.reject(new Error('Expected call to throw `NonUniqueShow` error')), err => {
                expect(err).to.be.instanceOf(NonUniqueShowError);
            });
        });

        it('verifies the show data against the show schema (and throws TypeError if it fails)', () => {
            const invalidObjects = [
                { name: 5 },    // name is not a string
                { name: ['bob'] },    // name is not a string
                { name: { eng: 'bob' } },    // name is not a string
                { name: 'okay', altNames: [{ type: 'random', name: 'alt' }] },  // altName type invalid
                {}              // mising name
            ];

            return Promise.all(invalidObjects.map(obj => uut.addShowToDatabase(obj).then(
                () => Promise.reject(new Error(`Should have rejected. Test data was ${JSON.stringify(obj)}`)),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(TypeError);
                })));
        });

        it('saves to the `shows` collection', () => {
            const saveSpy = new Spy(Promise.resolve(true));
            const collectionStub = new Spy({ save: saveSpy.func });
            dbStubs.collection = collectionStub.func;

            const data = { name: 'new Show name', data: ['fields', 'are', 'fine'] };

            return uut.addShowToDatabase(data).then(() => {
                expect(collectionStub.calledWith.length, 'expect db.collection to have ben called once').to.equal(1);
                expect(collectionStub.calledWith[0][0], 'Expected to save to `shows`').to.equal('shows');
                expect(saveSpy.calledWith.length, 'Expected there to have been only 1 call to Collection.save()').to.equal(1);
                expect(saveSpy.calledWith[0][0]).to.deep.equal(data);
            });
        });
    });
});

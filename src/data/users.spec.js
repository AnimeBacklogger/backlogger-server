'use strict';

/* globals describe it beforeEach */
/* eslint max-lines: "off" */ // disable max lines because it's a test file
// Set process env for less bcrypt rounds
process.env.BCRYPT_ROUNDS = 1;    // eslint-disable-line no-process-env

// Load modules
const { expect } = require('chai');
const proxyquire = require('proxyquire');

const dbStubs = {};
const users = proxyquire('./users', {
    './db': dbStubs
});
const { UserNotFoundError, NonUniqueUserError, ShowNotFoundError } = require('./dataErrors');
const databaseTestData = require('../../test/data/databaseData');
const { Spy } = require('../../test/utils');
const dataSchemas = require('./schemas');

describe('/data/users.js', () => {
    it('exports the expected methods', () => {
        const expectedMethods = [
            'getUserInfoByName',
            'validateUserLogin',
            'getUserBacklog',
            'getRecommendationsCreatedByUser',
            'setUserPassword',
            'addUser',
            'addRecommendation'
        ];
        expect(Object.keys(users)).to.have.members(expectedMethods);
    });

    describe('validateUserLogin()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));
        });

        it('returns a promise', () => {
            expect(users.validateUserLogin('test', 'password123').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('the promise returns true if password matches', () => users.validateUserLogin('test', 'password123').then(res => {
            expect(res).to.be.true; // eslint-disable-line no-unused-expressions
        }));

        it('the promise returns false if password does not match', () => users.validateUserLogin('test', 'wrong').then(res => {
            expect(res).to.be.false; // eslint-disable-line no-unused-expressions
        }));

        it('rejects with `UserNotFoundError` if user is not known', () => {
            // Query would return empty if user not found
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));

            return users.validateUserLogin('nonExistant', 'password123')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('rejects with `NonUniqueUserError` if multiple users exist under that name', () => {
            // Query would return with length >1
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([
                ...databaseTestData.getAuthResult(),
                ...databaseTestData.getAuthResult()
            ]));

            return users.validateUserLogin('nonExistant', 'password123')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(NonUniqueUserError);
                    }
                );
        });
    });

    describe('getUserInfoByName()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(
                databaseTestData.cursorWrapper(databaseTestData.getUserResult())
            );
        });

        it('returns a promise', () => {
            expect(users.getUserInfoByName('test1').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('Uses the expected AQL query', () => {
            const queryStub = dbStubs.query;
            const querySpy = new Spy(queryStub);
            dbStubs.query = querySpy.func;

            const expectedName = 'Chrolo';
            // The expected query, but with all double whitespace instances trimmed to single and left/right trimmed
            const expectedQuery = 'FOR u IN users FILTER u.name==@value0 LET friends = (FOR f,e IN 1..1 ANY u friendsWith RETURN {friendInfo: f, edge: e}) LET backlog = (FOR b,e IN 1..1 OUTBOUND u hasInBacklog RETURN {show:b, edge: e}) LET recommendations = ( FOR r,e IN 1..1 INBOUND u recommendationTo RETURN { rec: r, edge:e, show: (FOR s IN 1..1 OUTBOUND r recommendationFor RETURN s)[0], user: (FOR ru IN 1..1 OUTBOUND r recommendationFrom RETURN ru)[0] } ) RETURN { user: u, friends: friends, backlog: backlog, recommendations: recommendations }';

            return users.getUserInfoByName(expectedName).then(() => {
                // Expect the query function is only called once
                expect(querySpy.calledWith.length, 'Expected `.query()` to have been called once').to.equal(1);
                // Expect the exact query used
                const actualQuery = querySpy.calledWith[0][0].query;
                expect(actualQuery.replace(/\s+/g, ' ').trim()).to.equal(expectedQuery);
                // Expect the bound variables:
                const actualBindVars = querySpy.calledWith[0][0].bindVars;
                expect(actualBindVars).to.deep.equal({ value0: expectedName });
            });
        });

        it('returns the user data when found', () => users.getUserInfoByName('Chrolo').then(userData => {
            expect(userData).to.deep.equal({
                name: 'Chrolo',
                backlog: [
                    {
                        animeName: 'Punch Line',
                        malAnimeId: 28617,
                        malUrl: '',
                        personalScore: 8,
                        recommendations: []
                    }
                ],
                friends: [{ name: 'Begna112' }]
            });
        }));

        it('returns user data that validates against the user data schema', () => users.getUserInfoByName('Chrolo').then(userData => {
            const userDataSchemaValidator = dataSchemas.getAjvInstance().compile(dataSchemas.getSchemaById('user/index.schema.json'));
            const result = userDataSchemaValidator(userData);
            const schemaErrors = JSON.stringify(userDataSchemaValidator.errors, null, '  ');
            expect(result, `Errors validating data against schema:\n${schemaErrors}.`).to.be.true;  // eslint-disable-line no-unused-expressions
        }));

        it('rejects with `UserNotFoundError` if user is not known', () => {
            // Query would return empty if user not found
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));
            return users.getUserInfoByName('testNonKnown')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('rejects with `NonUniqueUserError` if multiple users are found', () => {
            // Query would return with length >1
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([
                ...databaseTestData.getUserResult(),
                ...databaseTestData.getUserResult()
            ]));
            return users.getUserInfoByName('test3')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(NonUniqueUserError);
                    }
                );
        });
    });

    describe('getUserBacklog()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(
                databaseTestData.cursorWrapper([{ user: 'test', backlog: databaseTestData.getShowsResult() }])
            );
        });

        it('returns a promise', () => {
            expect(users.getUserBacklog('test').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('rejects with `UserNotFoundError` if user is not known', () => {
            dbStubs.query = () => Promise.resolve(
                databaseTestData.cursorWrapper([])
            );
            return users.getUserBacklog('testNonKnown')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('returns the user\'s backlog as an array', () => users.getUserBacklog('test').then(backlog => {
            expect(backlog).to.be.instanceOf(Array);
            expect(backlog).to.have.deep.members([
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
            ]);
        }));

        it('returns array of backlog data that validates against the backlog data schema', () => users.getUserBacklog('Chrolo').then(backlog => {
            const backlogDataSchemaValidator = dataSchemas.getAjvInstance().compile(dataSchemas.getSchemaById('backlog/basic.schema.json'));
            backlog.forEach(backlogItem => {
                const result = backlogDataSchemaValidator(backlogItem);
                const schemaErrors = JSON.stringify(backlogDataSchemaValidator.errors, null, '  ');
                expect(result, `Errors validating data against schema:\n${schemaErrors}.`).to.be.true;  // eslint-disable-line no-unused-expressions
            });
        }));
    });

    describe('getRecommendationsCreatedByUser()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(
                databaseTestData.cursorWrapper([{ user: 'test', recs: databaseTestData.getUserRecommendationsResult() }])
            );
        });

        it('returns a promise', () => {
            expect(users.getRecommendationsCreatedByUser('test')).to.be.instanceOf(Promise);
        });

        it('returns an array of recommendations made by the user', () => users.getRecommendationsCreatedByUser('Needle').then(recs => {
            expect(recs).to.have.deep.members([
                {
                    animeName: 'Nichijou',
                    comment: "It's really sugoi Oniichan",
                    malAnimeId: 10165,
                    score: 10,
                    to: 'Begna112'
                },
                {
                    animeName: 'Nichijou',
                    comment: "It's really sugoi Oniichan",
                    malAnimeId: 10165,
                    score: 10,
                    to: 'Goshi'
                },
                {
                    animeName: 'Corey in the house',
                    comment: 'Oh shit waddup',
                    malAnimeId: 404,
                    score: 5,
                    to: 'Goshi'
                }
            ]);
        }));

        it('returns array of recommendations data that validates against the `recommendationsMade` data schema', () => users.getRecommendationsCreatedByUser('test').then(recommendations => {
            const userRecommendationsValidator = dataSchemas.getAjvInstance().compile(dataSchemas.getSchemaById('user/recomendationsMade.schema.json'));
            const result = userRecommendationsValidator(recommendations);
            const schemaErrors = JSON.stringify(userRecommendationsValidator.errors, null, '  ');
            expect(result, `Errors validating data against schema:\n${schemaErrors}.`).to.be.true;  // eslint-disable-line no-unused-expressions
        }));
    });

    describe('setUserPassword()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));
        });

        it('returns a promise', () => {
            expect(users.setUserPassword('test', 'test', 'test')).to.be.instanceOf(Promise);
        });

        it('returns false on a password set if old password does not match', () => users.setUserPassword('test', 'notOriginal', 'newPass').then(res => {
            // check response was false
            expect(res, 'setUserPassword should return false if passwords did not match.').to.equal(false);
        }));

        it('rejects if user does not exist', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));
            // attempt password change
            return users.setUserPassword('nonExistant', 'notOriginal', 'newPass').then(res => {
                // check for rejection
                throw new Error(`Test should've rejected. Instead saw: ${res}`);
            }, () => Promise.resolve());
        });

        it('allows the password to be set if the user has not got one set', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ auth: [{}] }]));  // user found, but blank auth info
            // attempt password change
            return users.setUserPassword('test', 'test', 'test').then(res => {
                expect(res, 'setUserPassword should return true if passwords was set.').to.equal(true);
            });
        });
    });

    describe('addUser()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));

            dbStubs.collection = () => ({
                save: () => ({ _id: 3 })
            });
        });

        const createValidUser = overrides => Object.assign({}, {
            name: 'bob',
            signIn: {
                hash: 'something'
            }
        }, overrides);

        it('returns a promise', () => {
            expect(users.addUser(createValidUser()).catch(() => undefined)).to.be.instanceOf(Promise);
        });

        it('rejects with `NonUniqueUserError` if user already exists', () => users.addUser(createValidUser({ name: 'test' })).then(
            () => Promise.reject(new Error('Should have rejected')),
            rejection => {
                expect(rejection, rejection).to.be.instanceOf(NonUniqueUserError);
            }
        ));

        it('Adds the user and resolves `true`', () => {
            // stub user not existing:
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));

            const expectedNewObject = createValidUser({ name: 'addTest' });
            return users.addUser(expectedNewObject).then(res => {
                expect(res, 'Should have resolved as `true`').to.equal(true);
            });
        });

        it('rejects with `TypeError` if userData is invalid', () => {
            const invalidObjects = [
                { name: 5 },
                {}
            ];

            return Promise.all(invalidObjects.map(obj => users.addUser(obj).then(
                () => Promise.reject(new Error(`Should have rejected. Test data was ${JSON.stringify(obj)}`)),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(TypeError);
                })));
        });
    });

    describe('addRecommendation()', () => {
        beforeEach(() => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([{ _id: 3 }]));
            dbStubs.collection = () => ({
                save: () => ({ _id: 3 })
            });
        });

        const testFromUser = 'Bob';
        const testToUser = 'Alice';
        const testShowName = 'Eve';
        const defaultRecommendation = {
            comment: 'How neat is that',
            score: 5
        };

        it('returns a promise', () => {
            expect(users.addRecommendation(testFromUser, testToUser, testShowName, defaultRecommendation).catch(e => e)).to.be.instanceOf(Promise);
        });

        it('rejects with `UserNotFoundError` if targeted user does not exist', () => {
            dbStubs.query = () => Promise.resolve(databaseTestData.cursorWrapper([]));
            return users.addRecommendation(testFromUser, testToUser, testShowName, defaultRecommendation)
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('rejects with `UserNotFoundError` if "fromUser" does not exist', () => {
            let c = 0;
            dbStubs.query = () => {
                c++;
                if (c === 2) {    // 2nd call is the fromUser call
                    return Promise.resolve(databaseTestData.cursorWrapper([]));
                }
                return Promise.resolve(databaseTestData.cursorWrapper([{ _id: 3 }]));
            };

            return users.addRecommendation(testFromUser, testToUser, testShowName, defaultRecommendation)
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('rejects with `ShowNotFoundError` if targeted show does not exist', () => {
            let c = 0;
            dbStubs.query = () => {
                c++;
                if (c === 3) {    // 3rd call is the getShowId call
                    return Promise.resolve(databaseTestData.cursorWrapper([]));
                }
                return Promise.resolve(databaseTestData.cursorWrapper([{ _id: 3 }]));
            };
            return users.addRecommendation(testFromUser, testToUser, testShowName, defaultRecommendation)
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(ShowNotFoundError);
                    }
                );
        });

        it('creates the appropriate edges', () => {
            let c = 0;
            dbStubs.query = () => {
                c++;
                return Promise.resolve(databaseTestData.cursorWrapper([{ _id: c }]));
            };

            const existingCollectionStub = dbStubs.collection;
            const dbCollectionSpy = new Spy(existingCollectionStub);
            dbStubs.collection = dbCollectionSpy.func;

            return users.addRecommendation(testFromUser, testToUser, testShowName, defaultRecommendation)
                .then(() => {
                    expect(dbCollectionSpy.calledWith.length, `Expected db.collection to have been called 4 times. saw ${dbCollectionSpy.calledWith.length}`).to.equal(4);
                    const actualSavedCollections = dbCollectionSpy.calledWith.map(x => x[0]);
                    const expectedSavedCollections = ['recommendations', 'recommendationTo', 'recommendationFrom', 'recommendationFor'];
                    expect(actualSavedCollections).to.deep.equal(expectedSavedCollections);
                });
        });
    });
});

/* globals describe it beforeEach*/
/*eslint max-lines: "off"*/ //disable max lines because it's a test file

//Set process env for less bcrypt rounds
process.env.BCRYPT_ROUNDS=1;    //eslint-disable-line no-process-env

// Load modules
const {expect} = require('chai');
const proxyquire = require('proxyquire');
const dbStubs = {};
const users = proxyquire('./users', {
    './db': dbStubs
});
const {UserNotFoundError, NonUniqueUserError} = require('./dataErrors');
const databaseTestData = require('../../test/data/databaseData');
const {Spy} = require('../../test/utils');
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
            dbStubs.query = () => {
                return Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));
            };
        });

        it('returns a promise', () => {
            expect(users.validateUserLogin('test', 'password123').catch(e => e)).to.be.instanceOf(Promise);
        });

        it('the promise returns true if password matches', () => {
            return users.validateUserLogin('test', 'password123').then((res) => {
                expect(res).to.be.true; //eslint-disable-line no-unused-expressions
            });
        });

        it('the promise returns false if password does not match', () => {
            return users.validateUserLogin('test', 'wrong').then((res) => {
                expect(res).to.be.false; //eslint-disable-line no-unused-expressions
            });
        });

        it('rejects with `UserNotFoundError` if user is not known', () => {
            //Query would return empty if user not found
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
            //Query would return with length >1
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
            const querySpy= new Spy(queryStub);
            dbStubs.query = querySpy.func;

            const expectedName = 'Chrolo';
            //The expected query, but with all double whitespace instances trimmed to single and left/right trimmed
            const expectedQuery = "FOR u IN users FILTER u.name==@value0 LET friends = (FOR f,e IN 1..1 ANY u friendsWith RETURN {friendInfo: f, edge: e}) LET backlog = (FOR b,e IN 1..1 OUTBOUND u hasInBacklog RETURN {show:b, edge: e}) LET recommendations = ( FOR r,e IN 1..1 INBOUND u recommendationTo RETURN { rec: r, edge:e, show: (FOR s IN 1..1 OUTBOUND r recommendationFor RETURN s)[0], user: (FOR ru IN 1..1 OUTBOUND r recommendationFrom RETURN ru)[0] } ) RETURN { user: u, friends: friends, backlog: backlog, recommendations: recommendations }";

            return users.getUserInfoByName(expectedName).then(() => {
                // Expect the query function is only called once
                expect(querySpy.calledWith.length, 'Expected `.query()` to have been called once').to.equal(1);
                // Expect the exact query used
                const actualQuery = querySpy.calledWith[0][0].query;
                expect(actualQuery.replace(/\s+/g, ' ').trim()).to.equal(expectedQuery);
                // Expect the bound variables:
                const actualBindVars = querySpy.calledWith[0][0].bindVars;
                expect(actualBindVars).to.deep.equal({value0: expectedName});
            });
        });

        it('returns the user data when found', () => {
            return users.getUserInfoByName('Chrolo').then(userData => {
                expect(userData).to.deep.equal({
                    name: 'Chrolo',
                    backlog: [
                        {
                            'animeName': 'Punch Line',
                            'malAnimeId': 28617,
                            'malUrl': "",
                            'personalScore': 8,
                            'recommendations': []
                        }
                    ],
                    friends: [{name: "Begna112"}]
                });
            });
        });

        it('returns user data that validates against the user data schema', () => {
            return users.getUserInfoByName('Chrolo').then(userData => {
                const userDataSchemaValidator = dataSchemas.getAjvInstance().compile(dataSchemas.getSchemaById('user/index.schema.json'));
                const result = userDataSchemaValidator(userData);
                const schemaErrors = JSON.stringify(userDataSchemaValidator.errors, null, '  ');
                expect(result, `Errors validating data against schema:\n${schemaErrors}.`).to.be.true;  // eslint-disable-line no-unused-expressions
            });
        });

        it('rejects with `UserNotFoundError` if user is not known', () => {
            //Query would return empty if user not found
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
            //Query would return with length >1
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
                databaseTestData.cursorWrapper([{user: 'test', backlog: databaseTestData.getShowsResult()}])
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

        it('returns the user\'s backlog as an array', () => {
            return users.getUserBacklog('test').then(backlog => {
                expect(backlog).to.be.instanceOf(Array);
                expect(backlog).to.have.deep.members([
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
                ]);
            });
        });

        it('returns array of backlog data that validates against the backlog data schema', () => {
            return users.getUserBacklog('Chrolo').then(backlog => {
                const backlogDataSchemaValidator = dataSchemas.getAjvInstance().compile(dataSchemas.getSchemaById('backlog/basic.schema.json'));
                backlog.forEach(backlogItem => {
                    const result = backlogDataSchemaValidator(backlogItem);
                    const schemaErrors = JSON.stringify(backlogDataSchemaValidator.errors, null, '  ');
                    expect(result, `Errors validating data against schema:\n${schemaErrors}.`).to.be.true;  // eslint-disable-line no-unused-expressions
                });
            });
        });
    });

    describe('getRecommendationsCreatedByUser()', () => {
        const basicBacklogObj = {
            "animeName": "Nichijou",
            "malAnimeId": 10165
        };
        const testRecs = [
            {name: 'Needle', data: 'a'},
            {name: 'NotNeedle', backLoggerName: "Needle", data: 'b'},
            {name: 'Needle', backLoggerName: "Bosh", data: 'c'}
        ];

        beforeEach(() => {
            dbStubs.getData = () => {
                return [
                    {
                        name: 'test',
                        backlog: [
                            Object.assign({}, basicBacklogObj, {recommendations: [testRecs[0]]}),
                            Object.assign({}, basicBacklogObj),
                            Object.assign({}, basicBacklogObj, {recommendations: [{name: 'bob', data: 'x'}, testRecs[1]]}),
                            Object.assign({}, basicBacklogObj, {recommendations: [testRecs[2], {name: 'bob', data: 'x'}]})
                        ]
                    }
                ];
            };
        });

        it('returns a promise', () => {
            expect(users.getRecommendationsCreatedByUser('test')).to.be.instanceOf(Promise);
        });

        it('returns an array of recommendations made by the user (matching both `name` and `backLoggerName`)', () => {
            return Promise.all([
                //Test user who's made recs
                users.getRecommendationsCreatedByUser('Needle').then(recs => {
                    expect(recs).to.have.members(testRecs);
                }),
                //Test user with no recs
                users.getRecommendationsCreatedByUser('SilentBob').then(recs => {
                    expect(recs).to.be.instanceOf(Array);
                    expect(recs.length).to.equal(0);
                })
            ]);
        });
    });

    describe('setUserPassword()', () => {

        beforeEach(() => {
            dbStubs.query = () => {
                return Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));
            };
        });

        it('returns a promise', () => {
            expect(users.setUserPassword('test', 'test', 'test')).to.be.instanceOf(Promise);
        });

        it('returns false on a password set if old password does not match', () => {
            return users.setUserPassword('test', 'notOriginal', 'newPass').then(res => {
                // check response was false
                expect(res, 'setUserPassword should return false if passwords did not match.').to.equal(false);
            });
        });

        it('rejects if user does not exist', () => {
            dbStubs.query = () => {
                return Promise.resolve(databaseTestData.cursorWrapper([]));
            };
            // attempt password change
            return users.setUserPassword('nonExistant', 'notOriginal', 'newPass').then(res => {
                // check for rejection
                throw new Error(`Test should've rejected. Instead saw: ${res}`);
            },  () => {
                return Promise.resolve();
            });
        });
    });

    describe('addUser()', () => {
        beforeEach(() => {
            dbStubs.query = () => {
                return Promise.resolve(databaseTestData.cursorWrapper(databaseTestData.getAuthResult()));
            };
        });

        const createValidUser = (overrides) => {
            return Object.assign({}, {
                name: 'bob',
                signIn: {
                    hash: "something"
                }
            }, overrides);
        };

        it('returns a promise', () => {
            expect(users.addUser(createValidUser())).to.be.instanceOf(Promise);
        });

        it('rejects with `NonUniqueUserError` if user already exists', () => {
            return users.addUser(createValidUser({name: 'test'})).then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(NonUniqueUserError);
                }
            );
        });

        it('Adds the user and resolve `true`', () => {
            const expectedNewObject = createValidUser({name: 'addTest'});
            return users.addUser(expectedNewObject).then(res => {
                expect(res, 'Should have resolved as `true`').to.equal(true);
                return users.getUserInfoByName(expectedNewObject.name).then(data => {
                    expect(data).to.deep.equal(expectedNewObject);
                });
            });
        });

        it('rejects with `TypeError` if userData is invalid', () => {
            const invalidObjects = [
                {name: 5},
                {}
            ];

            return Promise.all(invalidObjects.map(obj => {
                return users.addUser(obj).then(
                    () => Promise.reject(new Error(`Should have rejected. Test data was ${JSON.stringify(obj)}`)),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(TypeError);
                    });
            }));
        });

    });

    describe('addRecommendation()', () => {
        beforeEach(() => {
            dbStubs.data = [
                {
                    name: "test",
                    backlog: [
                        {
                            animeName: 'ExistingAnime',
                            malAnimeId: 1337
                        }
                    ]
                }
            ];
            dbStubs.getData = () => dbStubs.data;
        });

        const defaultRecommendation = {
            name: 'bob',
            score: 5
        };

        it('returns a promise', () => {
            expect(users.addRecommendation('test', 12, defaultRecommendation)).to.be.instanceOf(Promise);
        });

        it('rejects with `UserNotFoundError` if targeted user does not exist', () => {
            return users.addRecommendation('testNonKnown', 1, defaultRecommendation)
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        it('adds the anime to users backlog if it doesn\'t exist', () => {
            const newShowIdentifiers = [
                404,
                'newShow'
            ];
            return Promise.all(
                newShowIdentifiers.map(id => {
                    const expectedField = typeof id === 'number' ? 'malAnimeId' : 'animeName';
                    return users.addRecommendation('test', id, defaultRecommendation)
                        .then(() => {
                            return users.getUserInfoByName('test').then(userData => {
                                const backlogIndex = userData.backlog.findIndex(x => x[expectedField] === id);
                                expect(backlogIndex, `Expected anime with  ${expectedField}=${id} in user's backlog`).to.not.equal(-1);
                                expect(userData.backlog[backlogIndex].recommendations).to.have.members([defaultRecommendation]);
                            });
                        });
                })
            );
        });

        it('adds recomendation to users backlog entry from an AnimeName (non-number showId)', () => {
            const showId = 'ExistingAnime';

            return users.getUserInfoByName('test').then(originalUserData => {
                const backlogIndex = originalUserData.backlog.findIndex(x => x.animeName === showId);
                expect(backlogIndex, `Expected anime with  animeName:${showId} in user's backlog to exist before test`).to.not.equal(-1);
                return users.addRecommendation('test', showId, defaultRecommendation)
                    .then(() => {
                        return users.getUserInfoByName('test').then(userData => {
                            expect(backlogIndex, `Expected anime with  animeName:${showId} in user's backlog`).to.not.equal(-1);
                            expect(userData.backlog[backlogIndex].recommendations).to.have.members([defaultRecommendation]);
                        });
                    });
            });
        });

        it('adds recomendation to users backlog entry from an malAnimeId (numeric showId)', () => {
            const showId = 1337;
            return users.getUserInfoByName('test').then(originalUserData => {
                const backlogIndex = originalUserData.backlog.findIndex(x => x.malAnimeId === showId);
                expect(backlogIndex, `Expected anime with  malAnimeId:${showId} in user's backlog to exist before test`).to.not.equal(-1);
                return users.addRecommendation('test', showId, defaultRecommendation)
                    .then(() => {
                        return users.getUserInfoByName('test').then(userData => {
                            expect(backlogIndex, `Expected anime with  malAnimeId:${showId} in user's backlog`).to.not.equal(-1);
                            expect(userData.backlog[backlogIndex].recommendations).to.have.members([defaultRecommendation]);
                        });
                    });
            });
        });
    });
});

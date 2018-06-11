

/* globals describe it */
/* eslint max-lines: "off" */ // disable max lines because it's a test file

// Set process env for less bcrypt rounds
process.env.BCRYPT_ROUNDS = 1;    // eslint-disable-line no-process-env

// Load modules
const { expect } = require('chai');
const users = require('../../src/data/users');
const bcrypt = require('bcrypt');
const { UserNotFoundError, NonUniqueUserError, ShowNotFoundError } = require('../../src/data/dataErrors');
const dataSchemas = require('../../src/data/schemas');
const { rand } = require('../utils');
const { db } = require('./beforeAll');
const { aql } = require('arangojs');

describe('/data/users.js', () => {
    describe('validateUserLogin()', () => {
        const testUser = 'Chrolo';
        const password = 'password123';


        it('the promise returns true if password matches', () => users.validateUserLogin(testUser, password).then(res => {
            expect(res).to.be.true; // eslint-disable-line no-unused-expressions
        }));

        it('the promise returns false if password does not match', () => users.validateUserLogin(testUser, `${password}_not`).then(res => {
            expect(res).to.be.false; // eslint-disable-line no-unused-expressions
        }));

        it('rejects with `UserNotFoundError` if user is not known', () => users.validateUserLogin('nonExistant', password)
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                }
            ));
    });

    describe('getUserInfoByName()', () => {
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

        it('rejects with `UserNotFoundError` if user is not known', () => users.getUserInfoByName('testNonKnown')
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                }
            ));
    });

    describe('getUserBacklog()', () => {
        it('rejects with `UserNotFoundError` if user is not known', () => users.getUserBacklog('testNonKnown')
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                }
            ));

        it('returns the user\'s backlog as an array', () => users.getUserBacklog('Chrolo').then(backlog => {
            expect(backlog).to.be.instanceOf(Array);
            expect(backlog).to.have.deep.members([
                {
                    animeName: 'Punch Line',
                    malAnimeId: 28617,
                    personalScore: 8,
                    recommendations: [],
                    malUrl: ''
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
        it('returns an array of recommendations made by the user', () => {
            const expectedRecs = [
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
                }
            ];

            return users.getRecommendationsCreatedByUser('Chrolo').then(recs => {
                expect(recs).to.have.deep.members(expectedRecs);
                expect(recs.length).to.equal(expectedRecs.length);
            });
        });
    });

    describe('setUserPassword()', () => {
        const testUser = 'Chrolo';
        const oldPass = 'password123';
        const newPass = 'newPass';

        /**
         * @param {string} name user's name
         * @returns {string} the hash currently stored against the user in the database.
         */
        function getExistingHash(name) {
            return db.query(aql`
                FOR u IN users 
                    FILTER u.name==${name} 
                    FOR a IN 1..1 OUTBOUND u userAuth 
                        RETURN a
            `).then(cursor => cursor.all()).then(data => data[0].hash);
        }

        it('returns false on a password set if old password does not match (and does not change the password)', () => getExistingHash(testUser).then(prevHash => {
            const incorrectPassword = rand.getRandAlphaNumChars(4);

            // attempt password change
            return users.setUserPassword(testUser, incorrectPassword, newPass).then(res => {
                // check response was false
                expect(res, 'setUserPassword should return false if passwords did not match.').to.equal(false);
                // check password has not changed
                return getExistingHash(testUser).then(afterHash => {
                    expect(afterHash, 'Password should not have been changed').to.equal(prevHash);
                });
            });
        }));

        it('rejects if user does not exist', () =>
            // attempt password change
            users.setUserPassword('nonExistant', oldPass, newPass).then(res => {
                // check for rejection
                throw new Error(`Test should've rejected. Instead saw: ${res}`);
            }, () => Promise.resolve())
        );

        it('changes the stored hash correctly', () =>
            // Check existing hash
            getExistingHash(testUser).then(prevHash =>

                // attempt password change
                users.setUserPassword(testUser, oldPass, newPass).then(res => {
                    // check response was false
                    expect(res, 'setUserPassword should return true if password was changed.').to.equal(true);
                    // check password has changed
                    return getExistingHash(testUser).then(afterHash => {
                        expect(afterHash, 'Password should have been changed').to.not.equal(prevHash);
                        // check new password validates correctly
                        return bcrypt.compare(newPass, afterHash)
                            .then(x => expect(x, 'Comparison of new hash to new pass failed').to.be.true);
                    });
                })
            )
        );

        it('allows the password to be set if the user has not got one set', () => {
            const emptyPasswordUser = 'emptyPasswordUser';
            return users.setUserPassword(emptyPasswordUser, oldPass, newPass).then(res => {
                // check response was false
                expect(res, 'setUserPassword should return true if password was changed.').to.equal(true);
                // check password has changed
                return getExistingHash(emptyPasswordUser).then(afterHash => {
                    expect(afterHash, 'Password should have been set').to.exist;    // eslint-disable-line no-unused-expressions
                    // check new password validates correctly
                    return bcrypt.compare(newPass, afterHash)
                        .then(x => expect(x, 'Comparison of new hash to new pass failed').to.be.true);
                });
            });
        });
    });

    describe('addUser()', () => {
        it('rejects with `NonUniqueUserError` if user already exists', () => users.addUser({ name: 'Chrolo' }).then(
            () => Promise.reject(new Error('Should have rejected')),
            rejection => {
                expect(rejection, rejection).to.be.instanceOf(NonUniqueUserError);
            }
        ));

        it('Adds the user and resolve `true`', () => {
            // new user with name of 'addUserTest_' + 6 random characters
            const addUserInfo = {
                name: `addUserTest_${rand.getRandAlphaNumChars(6)}`,
                signIn: {
                    password: 'testPassword'
                }
            };

            const userInfoCopy = JSON.parse(JSON.stringify(addUserInfo));   // because the password setter will delete the password key when it's been used.

            return users.addUser(addUserInfo).then(res => {
                expect(res, 'Should have resolved as `true`').to.equal(true);
                return users.getUserInfoByName(userInfoCopy.name).then(data => {
                    expect(data).to.deep.equal({
                        name: userInfoCopy.name,
                        // does not return sign in info
                        backlog: [],    // adds blank backlog and friends
                        friends: []
                    });
                    // then check that password was set:
                    return db.query(aql`
                        FOR u IN users 
                            FILTER u.name==${userInfoCopy.name} 
                            FOR a IN 1..1 OUTBOUND u userAuth 
                                RETURN a
                    `).then(cursor => cursor.all()).then(authData => authData[0].hash)
                        .then(hash => bcrypt.compare(userInfoCopy.signIn.password, hash))
                        .then(compareRes => {
                            expect(compareRes, 'Password set did not match password given').to.be.true;    // eslint-disable-line no-unused-expressions
                        });
                });
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
                    expect(rejection, `${rejection}. \nFor data: ${JSON.stringify(obj)}\n`).to.be.instanceOf(TypeError);
                })));
        });
    });

    describe('addRecommendation()', () => {
        const testToUser = 'Begna112';
        const testFromUser = 'Chrolo';
        const testShowName = 'Nichijou';
        const testShowMalId = 10165;

        const getDefaultRecommendation = () => ({
            score: 5,
            comment: `This rec was added during a test. ${rand.getRandAlphaNumChars(6)}`
        });

        it('rejects with `UserNotFoundError` if targeted user does not exist', () => users.addRecommendation('testNonKnown', testFromUser, testShowName, getDefaultRecommendation())
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                }
            ));

        it('rejects with `UserNotFoundError` if from user does not exist', () => users.addRecommendation(testToUser, 'testNonKnown', testShowName, getDefaultRecommendation())
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                }
            ));

        it('rejects with `ShowNotFoundError` if show does not exist on database.', () => users.addRecommendation(testToUser, testFromUser, 0, getDefaultRecommendation())  // Show 0 does not exist
            .then(
                () => Promise.reject(new Error('Should have rejected')),
                rejection => {
                    expect(rejection, rejection).to.be.instanceOf(ShowNotFoundError);
                }
            ));

        it('adds a recommendation for the show to the user', () => {
            const newRec = getDefaultRecommendation();
            return users.addRecommendation(testToUser, testFromUser, testShowName, newRec)
                .then(res => {
                    expect(res, 'addRecommendation() should return true if successful').to.be.true; // eslint-disable-line no-unused-expressions
                    // Check recommendation exists:
                    return db.query(aql`
                        FOR r in recommendations
                            FILTER r.comment == ${newRec.comment}
                            RETURN {
                                rec: r,
                                to: (FOR u IN 1..1 OUTBOUND r recommendationTo RETURN u)[0],
                                from: (FOR u IN 1..1 OUTBOUND r recommendationFrom RETURN u)[0],
                                show: (FOR s IN 1..1 OUTBOUND r recommendationFor RETURN s)[0]
                            }
                    `).then(cursor => cursor.all())
                        .then(recs => {
                            expect(recs.length, 'Should be one recommendation found').to.equal(1);
                            const rec = recs[0];
                            expect(rec.to.name, 'Expect recommendation to be set "to" the correct user').to.equal(testToUser);
                            expect(rec.from.name, 'Expect recommendation to be set "from" the correct user').to.equal(testFromUser);
                            expect(rec.show.name, 'Expect recommendation to be set against the correct show').to.equal(testShowName);
                            expect(rec.show.malAnimeId, 'Expect recommendation to be set against the correct show').to.equal(testShowMalId);
                        });
                });
        });
    });
});

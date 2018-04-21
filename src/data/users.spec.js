/* globals describe it beforeEach*/

//Set process env for less bcrypt rounds
process.env.BCRYPT_ROUNDS=1;

// Load modules
const {expect} = require('chai');
const proxyquire = require('proxyquire');
const dbStubs = {};
const users = proxyquire('./users', {
    './db': dbStubs
});
const bcrypt = require('bcrypt');
const {UserNotFoundError} = require('./dataErrors');

describe('/data/users.js', () => {

    it('exports the expected methods', () => {
        const expectedMethods = [
            'getUserInfoByName',
            'validateUserLogin',
            'getUserBacklog',
            'getRecommendationsCreatedByUser',
            'setUserPassword'
        ];
        expect(Object.keys(users)).to.have.members(expectedMethods);
    });

    describe('validateUserLogin()', () => {
        beforeEach(() => {
            dbStubs.getData = () => {
                return [
                    {
                        name: "test",
                        signIn: {
                            hash: '$2a$04$SRvT3uSabpCoNWDcrle6f.fI1Z4OOngDpeIc7QGpo8tWrd7Ey3C5.'    //hash of 'password123' with 1 round
                        }
                    }
                ];
            };
        });

        it('returns a promise', () => {
            expect(users.validateUserLogin('test', 'password123')).to.be.instanceOf(Promise);
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
            return users.validateUserLogin('nonExistant', 'password123')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });
    });

    describe('getUserInfoByName()', () => {
        beforeEach(() => {
            dbStubs.getData = () => {
                return [
                    {name: 'test1', exampleData: 'a'},
                    {name: 'test2', exampleData: 'b'},
                    {name: 'test3', exampleData: 'c'},
                    {name: 'test3', exampleData: 'd'}
                ];
            };
        });

        it('returns a promise', () => {
            expect(users.getUserInfoByName('test1')).to.be.instanceOf(Promise);
        });

        it('returns the user data when found', () => {
            return users.getUserInfoByName('test1').then(userData => {
                expect(userData).to.deep.equal({name: 'test1', exampleData: 'a'});
            });
        });

        it('rejects with `UserNotFoundError` if user is not known', () => {
            return users.getUserInfoByName('testNonKnown')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(UserNotFoundError);
                    }
                );
        });

        //*/
        it('returns first user if multiple users are found', () => {
            return users.getUserInfoByName('test3')
                .then(data => {
                    expect(data.exampleData).to.equal('c');
                });
        });
        /*/ //TODO: Change to an error if non-unique user:
        it('rejects with `NonUniqueUser` if multiple users are found', ()=>{
            return users.getUserInfoByName('test3')
                .then(
                    () => Promise.reject(new Error('Should have rejected')),
                    rejection => {
                        expect(rejection, rejection).to.be.instanceOf(NonUniqueUser);
                    }
                );
        });
        //*/
    });

    describe('getUserBacklog()', () => {
        const expectedBacklog = ['some', 'series', 'of', 'data'];
        beforeEach(() => {
            dbStubs.getData = () => {
                return [{name: 'test', backlog: [...expectedBacklog]}];
            };
        });

        it('returns a promise', () => {
            expect(users.getUserBacklog('test')).to.be.instanceOf(Promise);
        });

        it('rejects with `UserNotFoundError` if user is not known', () => {
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
                expect(backlog).to.deep.equal(expectedBacklog);
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
            dbStubs.data = [
                {
                    name: "test",
                    signIn: {
                        hash: '$2a$04$SRvT3uSabpCoNWDcrle6f.fI1Z4OOngDpeIc7QGpo8tWrd7Ey3C5.'    //hash of 'password123' with 1 round
                    }
                }
            ];
            dbStubs.getData = () => dbStubs.data;
        });

        it('returns a promise', () => {
            expect(users.setUserPassword('test', 'test', 'test')).to.be.instanceOf(Promise);
        });

        it('returns false on a password set if old password does not match (and does not change the password)', () => {
            // Check get user data
            return users.getUserInfoByName('test').then(originalData => {
                const prevHash = originalData.signIn.hash;

                // attempt password change
                return users.setUserPassword('test', 'notOriginal', 'newPass').then(res => {
                    // check response was false
                    expect(res, 'setUserPassword should return false if passwords did not match.').to.equal(false);
                    // check password has not changed
                    return users.getUserInfoByName('test').then(after => {
                        expect(after.signIn.hash, 'Password should not have been changed').to.equal(prevHash);
                    });
                });
            });
        });

        it('rejects if user does not exist', () => {
            // attempt password change
            return users.setUserPassword('nonExistant', 'notOriginal', 'newPass').then(res => {
                // check for rejection
                throw new Error(`Test should've rejected. Instead saw: ${res}`);
            },  () => {
                return Promise.resolve();
            });
        });

        it('changes the stored hash correctly', () => {
            // Check get user data
            return users.getUserInfoByName('test').then(originalData => {
                const prevHash = originalData.signIn.hash;
                const newPass = 'newPass';

                // attempt password change
                return users.setUserPassword('test', 'password123', newPass).then(res => {
                    // check response was false
                    expect(res, 'setUserPassword should return true if password was changed.').to.equal(true);
                    // check password has changed
                    return users.getUserInfoByName('test').then(after => {
                        expect(after.signIn.hash, 'Password should have been changed').to.not.equal(prevHash);
                        return bcrypt.compare(newPass, after.signIn.hash).then(x => expect(x, 'Comparison of new hash to new pass failed').to.be.true);
                    });
                });
            });

            // Check get user data
            // attempt password change
            // check for rejection
            // check password has changed
            // check new password validates correctly

        });
    });
});

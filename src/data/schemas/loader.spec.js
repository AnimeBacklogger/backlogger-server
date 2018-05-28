/* globals describe it*/
const {expect} = require('chai');
const proxyquire = require('proxyquire');
const path = require('path');
const TEST_SCHEMA_STUB_NAME = path.resolve(__dirname, './test/schema.json');
const testSchemaStub = {
    "$id": "wrong",
    "something": {
        "$ref": "../../bob.file"    // would be
    },
    "somethingElse": {
        "data": {
            "$ref": "./this.file"
        }
    },
    '@noCallThru': true
};

const uut = proxyquire('./loader.js', {
    [TEST_SCHEMA_STUB_NAME]: testSchemaStub
});

describe('/data/schemas/loader', () => {

    describe('prefixSchemaId()', () => {
        it('adds the system\'s schemaId prefix to a given id', () => {
            const expectedPrefix = 'BACKLOGGER_SCHEMAS/';
            expect(uut.prefixSchemaId('bob')).to.equal(`${expectedPrefix}bob`);
        });
    });

    describe('loadSchema()', () => {
        it('overwrites the $id of the schema with one relative to the schema root', () => {
            expect(uut.loadSchema(TEST_SCHEMA_STUB_NAME)['$id']).to.equal(uut.prefixSchemaId('test/schema.json'));
        });
    });

    describe('objectKeyFinder()', () => {
        it('calls the callback for each matching key in the object', () => {
            let count = 0;
            const cb = () => {
                count++;
            };

            const tests = [
                {
                    input: {a: 1, b: 2, c: 3, d: 4, x: 'test'},
                    expect: 1
                },
                {
                    input: {a: 1, b: {x: 'test'}, c: 3, x: 'test'},
                    expect: 2
                },
                {
                    input: {a: 1, b: [{x: 'test'}, {x: 'test'}, {x: 'test'}], c: 3, x: 'test'},
                    expect: 4
                }
            ];

            tests.forEach(test => {
                count = 0;
                uut.objectKeyFinder(test.input, 'x', cb);
                expect(count, `Expected to find key 'x' ${test.expect} times in ${JSON.stringify(test.input)}`).to.equal(test.expect);
            });
        });

        it('replaces the key with value from callback ', () => {
            const cb = () => 'carrot';

            const tests = [
                {
                    input: {a: 1, b: 2, c: 3, d: 4, x: 'test'},
                    expect: {a: 1, b: 2, c: 3, d: 4, x: 'carrot'}
                },
                {
                    input: {a: 1, b: {x: 'test'}, c: 3, x: 'test'},
                    expect: {a: 1, b: {x: 'carrot'}, c: 3, x: 'carrot'}
                },
                {
                    input: {a: 1, b: [{x: 'test'}, {x: 'test'}, {x: 'test'}], c: 3, x: 'test'},
                    expect: {a: 1, b: [{x: 'carrot'}, {x: 'carrot'}, {x: 'carrot'}], c: 3, x: 'carrot'}
                }
            ];

            tests.forEach(test => {
                const processed = JSON.parse(JSON.stringify(test.input)); //take deep copy
                uut.objectKeyFinder(processed, 'x', cb);    //process it
                expect(processed, `Expected ${JSON.stringify(test.expect)} but got ${JSON.stringify(processed)}`).to.deep.equal(test.expect);
            });
        });
    });
});

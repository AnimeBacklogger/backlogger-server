/* globals describe it before*/
const {expect} = require('chai');
const proxyquire = require('proxyquire');
const path = require('path');
const stubs = {};
const uut = proxyquire('./index.js', stubs);

const expectedSchemas = [
    'anime/mal.schema.json',
    'backlog/basic.schema.json',
    'user/basic.schema.json',
    'user/index.schema.json',
    'user/mal.schema.json',
    'user/signIn.schema.json',
    'user/twitterSignIn.schema.json'
];

describe('/data/schemas/index.js', () => {
    before(() => {
        return uut.loadSchemas();
    });

    describe('getListOfSchemaFiles()', () => {
        it('loads files matching glob of **/*.schema.json', () => {
            return uut.getListOfSchemaFiles().then(schemaFilesFound => {
                const expectedSchemaFilePaths = expectedSchemas.map(x => path.resolve(__dirname, x));
                expect(schemaFilesFound).to.have.members(expectedSchemaFilePaths);
            });
        });
    });

    describe('LOADED_SCHEMAS', () => {
        it('should contain the list of expected schemas', () => {
            const expectedSchemaKeys = expectedSchemas.map(x => require('./loader').prefixSchemaId(x));
            expect(Object.keys(uut.LOADED_SCHEMAS)).to.have.members(expectedSchemaKeys);
        });
    });

    describe('getAjvInstance()', () => {
        it('gives an ajv instance with all schemas loaded', () => {
            const testInst = uut.getAjvInstance();

            const expectedSchemaKeys = expectedSchemas.map(x => require('./loader').prefixSchemaId(x));
            expectedSchemaKeys.forEach(schemaId => {
                expect(testInst.getSchema(schemaId), `Missing schema ${schemaId}`).to.not.be.undefined;     //eslint-disable-line no-unused-expressions
            });
        });
    });

});

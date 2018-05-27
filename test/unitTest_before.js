//Lets limit those damn logs!
const Logger = require('../src/util/Logger');
console.log('Setting Logger output to `error`. To change, edit `/test/unitTest_before.js`');
Logger.setLogLevel('error', true);

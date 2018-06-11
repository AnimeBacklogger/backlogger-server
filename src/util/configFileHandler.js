

const path = require('path');
const fs = require('fs');
const Logger = require('../util/Logger');

// Setup the default config
const defaultSettings = {
    arango: {
        host: 'localhost',
        database: 'backlogger'
    },
    logger: {
        level: 'warn'
    },
    server: {
        port: 8080,
        hostname: undefined
    }
};

/**
 * @returns {Object} a copy of the default configuration
 */
function getDefaultConfig() {
    return JSON.parse(JSON.stringify(defaultSettings));
}

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '../../config.json');

let instanceSettings = getDefaultConfig();

/**
 * @returns {Object} a copy of the configuration object
 */
function getConfig() {
    // a copy of the settings, so they don't fuck shit up
    return JSON.parse(JSON.stringify(instanceSettings));
}

/**
 * Note, properties in object2 overwrite those in object1
 * @param {Object} object1 a base object
 * @param {Object} object2 an object with possibly new values and possible overrides
 * @returns {Object} an object with values in object1, but superseded and extended by object2
 */
function deepMergeObject(object1, object2) {
    // deep clone object1
    const newObject = JSON.parse(JSON.stringify(object1));

    Object.keys(object2).forEach(key => {
        if (typeof newObject[key] === 'undefined') {
            newObject[key] = JSON.parse(JSON.stringify(object2[key]));
        } else if (typeof newObject[key] !== typeof object2[key]) {
            Logger.error('ConfigFileHandler', `Type mismatch in config. ${key} was seen as ${newObject[key]}(${typeof newObject[key]}) and ${object2[key]}(${typeof object2[key]})`);
        } else if (typeof object2[key] === 'object') {
            newObject[key] = deepMergeObject(newObject[key], object2[key]);
        } else {
            newObject[key] = object2[key];
        }
    });

    return newObject;
}

/**
 *
 * @param {string} configFile path from cwd to the configuration file
 * @returns {Object} the loaded configuration
 */
function loadSettingsFromFile(configFile = DEFAULT_CONFIG_PATH) {
    if (!configFile || typeof configFile !== 'string') {
        throw new TypeError(`Config file path must be string, was ${configFile} ${typeof configFile}.`);
    }

    // If non-default specified, resolve relative to process:
    if (configFile !== DEFAULT_CONFIG_PATH) {
        configFile = path.resolve(process.cwd(), configFile);   // eslint-disable-line no-param-reassign
    }

    let loadedFile = {};
    // load in the file (if it exists)
    if (fs.existsSync(configFile)) {
        Logger.info('ConfigFileHandler', `Attempting to load from '${configFile}'`);
        try {
            loadedFile = require(configFile);   // eslint-disable-line global-require, import/no-dynamic-require
        } catch (err) {
            Logger.error('ConfigFileHandler', `File '${configFile}' could not be parsed.`, err);
            process.exit(1);
        }
    } else {
        Logger.warn('ConfigFileHandler', 'No config file found. Assuming defaults.');
    }

    // Set the new settings:
    instanceSettings = deepMergeObject(defaultSettings, loadedFile);
    return getConfig(); // for convienence, we return the settings to the user.
}

/**
 * Strips out config that matches the default config:
 * @param {Object} config the configuration to be minimised
 * @param {Object} comparedConfig the default object (against which keys can be removed)
 * @returns {Object} a new object, where any values in config that are default values have been removed.
 */
function minimiseConfig(config, comparedConfig = getDefaultConfig()) {
    Logger.debug('confighandler:minimiseConfig', `Comparing:\n${JSON.stringify(config)}\n${JSON.stringify(comparedConfig)}`);
    return Object.keys(config).reduce((acc, key) => {
        const configuredSetting = config[key];
        const defaultSetting = comparedConfig[key];

        if (typeof configuredSetting === 'object' && !(configuredSetting instanceof Array)) {
            const res = minimiseConfig(configuredSetting, defaultSetting);
            if (Object.keys(res).length !== 0) {
                acc[key] = res;
            }
        } else if ((configuredSetting === defaultSetting) || configuredSetting === undefined) {
            // If it's not defined OR is the default anyway, get rid of it.
            return acc;
        } else {
            acc[key] = configuredSetting;
        }
        return acc;
    }, {});
}

module.exports = {
    loadSettingsFromFile,
    getDefaultConfig,
    getConfig,
    minimiseConfig,
    DEFAULT_CONFIG_PATH
};

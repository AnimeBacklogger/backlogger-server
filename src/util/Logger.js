/**
This is a wrapper for the console logs at the moment. In the future I hope to integrate with with
a proper logging system;
*/

/**
Level: [alias]
0: error,
1: warn,
2: info,
3: verbose
4: debug,
5: silly
Note: use array indexs for text -> int transformation
*/
const LOG_LEVELS = [
    'silent',
    'error',
    'warn',
    'info',
    'verbose',
    'debug',
    'silly'
];

const config = {
    logLevel: 'debug',  //assume debug level until told otherwise
    logToFile: false,
    logFilePath: null,
    timestamp: true
};

function setLogLevel(level, hideChangeMessage=false){
    if(!LOG_LEVELS.includes(level)){
        throw new TypeError(`Logger level '${level}' is not recognised. Try one of ${JSON.stringify(LOG_LEVELS)}`);
    }
    config.logLevel = level;
    prevLevel= level;
    if(!hideChangeMessage){
        console.log(formatLogMessage('Logger', `Logger level set to ${level}.`));   //eslint-disable-line no-console
    }
}
function getLogLevel(){
    return config.logLevel;
}

let prevLevel=null;
function toggleLogMute(){
    if(prevLevel===null){
        prevLevel = config.logLevel;
        config.logLevel = 'silent';
    } else {
        config.logLevel = prevLevel;
        prevLevel = null;
    }
}

function formatLogMessage(tag, message, dataPresent){
    let timestamp = '';
    if(config.timestamp){
        timestamp = `${new Date().toISOString()} `;
    }
    return `${timestamp}[${tag}] ${message}${dataPresent? ': ':''}`.trim();
}

function shouldLog(level){
    if(!LOG_LEVELS.includes(level)){
        throw new Error(`Error level '${level}' not recognised.`);
    }
    //If level is less than or equal to the level we're logging at:
    return LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(config.logLevel);
}

function log(level, tag, message, ...data) {
    if(!shouldLog(level)) {
        return;
    }

    const string = formatLogMessage(tag, message);

    /*eslint-disable no-console*/
    switch(level) {
        case 'error':
            console.error(`[${level}]`, string, ...data);
            break;
        case 'warn':
            console.warn(`[${level}]`, string, ...data);
            break;
        case 'info':
            console.log(`[${level}]`, string, ...data);
            break;
        case 'debug':
            console.info(`[${level}]`, string, ...data);
            break;
        case 'silly':
            console.info(`[${level}]`, string, ...data);
            break;
        default:
            throw new TypeError(`Failed to log at level ${level}. Message was: ${string} ${data}`);
    }
    /*eslint-enable no-console*/
}

// helper functions:
function error(tag, message, ...data){
    log('error', tag, message, ...data);
}

function verbose(tag, message, ...data){
    log('verbose', tag, message, ...data);
}

function warn(tag, message, ...data){
    log('warn', tag, message, ...data);
}

function info(tag, message, ...data){
    log('info', tag, message, ...data);
}

function debug(tag, message, ...data){
    log('debug', tag, message, ...data);
}

function silly(tag, message, ...data){
    log('silly', tag, message, ...data);
}

module.exports = {
    getLogLevel,
    setLogLevel,
    toggleLogMute,
    log,
    error, warn, verbose, info, debug, silly,
    LOG_LEVELS
};

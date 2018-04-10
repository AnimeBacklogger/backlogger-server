const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

/**
Function to wrap a Mongo connection and ensure auto-terminations
@param callback function(err, MongoClient)=>Promise. The callback to be handed the connection. MUST return a promise so connection is terminated AFTER use.
*/
function connectionWrapper(callback){
    const connectionUrl = `mongodb://${config.URL}:${config.PORT}`;
    return MongoClient.connect(connectionUrl).then((connectedClient) => {
        const close = () => connectedClient.close();
        return Promise.all([callback(null, connectedClient)]).then(close, close);   //close whether success or failure
    }).catch((err) => {
        callback(err);
        return Promise.reject(err);
    });
}

module.exports= {
    connectionWrapper
};

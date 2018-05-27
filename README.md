# Backlogger
## What is it?
Building on [MAL](myanimelist.net), Backlogger is there to help those of us with too much to watch and too little time.
It's a place to prioritise your backlog and get input from your friends, or even just the internet at large.

# Project Details
The project consists of 3 major parts, though both server components will initially be one unit:
- Server side
  - Data API
  - Website server
- Client side
  - webpages / webapp (likely to be React based)

## Server side
### Data API
This will provide the endpoints for any dynamic data needed by the system (static content to be handled by webserver).
This includes functionality for __user login__, __user friends__ and __user animelist__.

### Website Server
This will provide the endpoints through which you receive webpage and static content.

## Client Side

## Backend systems
One the server side the following must also be in place:
- ArangoDb: for data storage.



## Config.json
The program will automatically attempt to load a `config.json` from the project root, which will be used for configuration of the system on startup. You can specify an alternative config file using the `-c` flag at startup. Any file that can be parsed by NodeJs that returns a javascript object will do (you can write it as a `.js` file to be evaluated at runtime and/or obtain secrets from other areas of the system)


### `arango`
| key |default value | description |
| - | - | - |
| host |`localhost` | the hostname for the Arango instance |
| password | __null__ | The password to use when connecting to the database |
| database | `backlogger` | The database to use |


__Example config__
```json
{
    "arango":{
        "user": "databaseWriteUser",
        "host": "192.168.0.1",
        "database": "aSpareDatabase"
    }
}
```

### `server`
| key |default value | description |
| - | - | - |
| port | `8080` | the port for the server to run on |
| hostname | `undefined` | hostname to listen on. If left undefined, listens on the `undefined IP` (all IPs the machine responds to) as noted in [the node documentation](https://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback) |


__Example config__
```json
{
    "server":{
        "port": 8080,
        "hostname": "example.com"
    }
}
```

### `logger`
| key |default value | description |
| - | - | - |
| level | `info` | The log level. Available levels (in order from least to most verbose) are `"silent", "error", "warn",  "info", "debug", "silly"` |


__Example config__
```json
{
    "logger":{
        "level": "debug"
    }
}
```
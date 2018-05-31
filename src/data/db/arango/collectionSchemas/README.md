# Database structure

## Vertecies

### Users (Vertex)
```json
{
    "type": "object",
    "properties": {
        "name": { "description": "username" },
        "linkedMalAccount": { "description": "the MAL account linked to this profile" } 
    }
}
```

### Recommendation (Vertex)
```json
{
    "type": "object",
    "properties": {
        "score": { "type": "integer","description": "recommendation level" }, 
        "comment": { "description": "comment regarding recommendation" }
    }
}
```
### Shows (Vertex)
```json
{
    "type": "object",
    "properties": {
        "name": { "description": "name of the show" }, 
        "description": { "description": "show short description" },
        "malAnimeId": {"description": "ID of anime on MAL"},
        "malUrl": {"description": "MAL url"}
    }
}
```

### authInformation (Vertex)
```json
{
    "type": "object",
    "description": "object representing various aspects of authentication in data",
    "properties": {
        "hash": { "type": "string", "description": "bcrypted password"}
    }

}
```

## Edges

### recommendationTo (Edge) [recommendation -> user]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<recommendation>._id" },
        "_to": { "description": "<user>._id" }
    }
}
```

### recommendationFrom (Edge) [user -> recommendation]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<user>._id" },
        "_to": { "description": "<recommendation>._id" }
    }
}
```

### recommendationFor (Edge) [recommendation -> show]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<recommendation>._id" },
        "_to": { "description": "<show>._id" }
    }
}
```

### friendsWith (Edge) [user <-> user]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<user>._id" },
        "_to": { "description": "<user>._id" },
        "malImport": { "type": "boolean", "description": "Was this relationship imported from MAL?"}
    }
}
```

### hasInBacklog (Edge) [user -> show]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<user>._id" },
        "_to": { "description": "<show>._id" },
        "personalScore": { "type": "integer" },
        "order": {
            "type": "integer", 
            "description": "The order this show appears in the backlog. Lowest is higher priority, undefined/null are unranked (lowest)"
            }
    }
}
```

### userAuth (Edge) [user -> authInformation]
```json
{
    "type": "object",
    "properties": {
        "_from": { "description": "<user>._id" },
        "_to": { "description": "<authInformation>._id" }
    }
}
```
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
- MongoDB: for data storage.

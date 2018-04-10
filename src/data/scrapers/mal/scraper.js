//  This file is for performing scrapes of MAL for information.
// Usually this is for a users animeList.
const request = require('request-promise');

async function scrapeUserAnimeList(userName){
    const url = `https://myanimelist.net/animelist/${userName}/load.json`;
    let exitFlag = false;
    let offset = 0;
    let i = 0;

    const fullList = [];

    const requestFunc = (data) => {
        data = JSON.parse(data);
        fullList.push(...data);

        offset += data.length;
        i++;

        if(data.length === 0 || i > 10){
            exitFlag = true;
        }
    };

    while(!exitFlag){   //eslint-disable-line no-unmodified-loop-condition
        const requestUrl = `${url}?offset=${offset}`;

        await request(requestUrl).then(requestFunc).catch(error => {
            console.error(`Failed to fetch ${url}: `, error);
        });
    }
    //Returns as a promise because the function is async
    return fullList;
}

async function scrapeUserFriendsList(userName){
    //TODO
}

module.exports = {
    scrapeUserAnimeList,
    scrapeUserFriendsList
};

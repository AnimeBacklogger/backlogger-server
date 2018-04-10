
const STATUSES = {
    'watching': 1,
    'finished': 2,
    'onHold': 3,
    'dropped': 4,
    'planToWatch': 6
};

function filterByPlanToWatch(resultList){
    return resultList.filter(item => item.status === STATUSES.planToWatch);
}

function filterBy(status, resultList){
    let statusCode = status;
    if(typeof status === 'string' && STATUSES[status] !== undefined){
        statusCode = STATUSES[status];
    }
    if(!Object.values(STATUSES).includes(statusCode)){
        throw new TypeError(`Status '${status}' was not a recognised code: Try ${JSON.stringify(Object.keys(STATUSES))}`);
    }

    return resultList.filter(item => item.status === statusCode);
}

module.exports = {
    filterByPlanToWatch,
    filterBy,
    STATUSES
};

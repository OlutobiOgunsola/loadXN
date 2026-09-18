const { Agent, setGlobalDispatcher } = require('undici');

setGlobalDispatcher(new Agent({
    keepAliveTimeout: 10_000,
    connections: 100, // max concurrent connections in the pool — tune this deliberately
}));

module.exports = {
    send: ({url, method, body, data}) => {
        return fetch(url, {
            body,
            data,
            method
        })
    }
}
const RequestClass = require('./request');
const RequestClient = require('./client');

class Http {
    constructor (url, method, body, data) {
        this.client = new RequestClient('fetch', url, method, body, data);
    }
    
    generateRequests(count) {
        while (count) {
            const req = new RequestClass();

            this.client.fire(req);

            count--;
        }
    }
}

module.exports = Http;
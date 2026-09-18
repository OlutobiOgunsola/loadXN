const HTTP_STRATEGIES = require('./strategies');

class Client {
    constructor(client, url, method, body, data) {
        if (!HTTP_STRATEGIES[client]) throw new Error("Unknown HTTP Client");

        this.client = HTTP_STRATEGIES[client];
        this.url = url;
        this.body = body;
        this.data = data;
        this.method = method;
    }

    fire(request) {
        request.begin();
        this.client.send({
            url: this.url,
            method: this.method,
            body: this.body,
            data: this.data
        }).then(res => request.onSuccess(res)).catch(err => request.onError(err));
    }
}

module.exports = Client;
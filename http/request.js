const eventBus = require('../events');

class Request {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.duration = 0;
        this.responseCode = 0;
        this.message = null;
    }

    begin() {
        this.startTime = performance.now() // grab start time in ms for duration calculation
        eventBus.emit('requestStarted', {
            startedAt: this.startTime
        });
    }

    terminate() {
        this.endTime = performance.now();
        this.duration = this.endTime - this.startTime;
        eventBus.emit('requestCompleted', {
            duration: this.duration,
            message: this.message,
            code: this.responseCode
        })
    }

    onSuccess(response) {
        this.responseCode = response.status;
        this.message = 'success'
        this.terminate();
    }

    onError(error) {
        this.responseCode = error.status;
        this.message = error.message;
        this.terminate();
    }
}

module.exports = Request;
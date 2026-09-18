const eventBus = require('../events');

class State {
    constructor({rate, maxConcurrency, duration}) {
        this.rate = rate;
        this.maxConcurrency = maxConcurrency;

        this.activeRequests = 0;
        this.totalStarted = 0;
        this.totalCompleted = 0;
        this.lifecycle = 'CREATED';
        this.initTS = 0;
        this.duration = duration;

        eventBus.on('requestStarted', () => {
            this.activeRequests++;
            this.totalStarted++;
        });

        eventBus.on('requestCompleted', () => {
            this.activeRequests--;
            this.totalCompleted++;
        });
    }

    removeActiveRequest() {
        this.totalCompleted++;
        this.activeRequests--;

        if (
            this.lifecycle === 'STOPPING' &&
            this.activeRequests === 0
        ) {
            this.lifecycle = 'STOPPED';
        }
    }

    addActiveRequest() {
        this.totalStarted++;
        this.activeRequests++;
    }

    breakLoadTest() {
        eventBus.emit('testCompleted', {
            totalStarted: this.totalStarted,
            initTS: this.initTS,
        });
        
        this.lifecycle =
            this.activeRequests > 0
                ? 'STOPPING'
                : 'STOPPED';
    }

    startLoadTest() {
        this.lifecycle = 'RUNNING';
        this.initTS = Date.now();
    }
}

module.exports = State;
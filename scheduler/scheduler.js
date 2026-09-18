const eventBus = require('../events');

class Scheduler {
    constructor (appState, requestClient, appMetrics) {
        this.appState = appState;
        this.pendingRequestsCount = 0;
        this.requestClient = requestClient;
        this.appMetrics = appMetrics;

        eventBus.on('requestCompleted', () => {
            if(this.appState.lifecycle !== 'RUNNING') {
                return;
            }

            // check if there is bandwidth for more requests
            const requestsDeficit = this.getRequestsDeficit();
            const ceilingDeficit = this.appState.maxConcurrency - this.appState.activeRequests;

            this.pendingRequestsCount = Math.min(requestsDeficit, ceilingDeficit);

            this.appMetrics.write(
                `active: ${this.appState.activeRequests}, :::::: started: ${this.appState.totalStarted}, :::::: completed: ${this.appState.totalCompleted}, :::::: expected: ${Date.now() - this.appState.initTS}, :::::: deficit: ${requestsDeficit}, :::::: available: ${ceilingDeficit}, :::::: dispatch: ${this.pendingRequestsCount}`,
                './metrics.csv',
                true
            )

            this.requestClient.generateRequests(this.pendingRequestsCount);
        })
    };

    getRequestsDeficit() {
        const elapsed = Date.now() - this.appState.initTS;

        console.log(`${Math.floor(elapsed / 1000)}seconds running ::::::::::::: `)

        if(elapsed >= this.appState.duration) {
            console.log("Breaking Load Test :::::::: ")
            this.appState.breakLoadTest();
        }

        const expected = Math.ceil(elapsed * this.appState.rate / 1000);
        
        // const deficit = expected - this.appState.totalStarted;

        const deficit = this.appState.maxConcurrency - this.appState.activeRequests;
        
        console.log({
            elapsed,
            expected,
            totalStarted: this.appState.totalStarted,
            deficit
        });
        return deficit;
    }

    runLoadTest() {
        this.appState.startLoadTest();

        const maxConcurrency = this.appState.maxConcurrency;
        const rate = this.appState.rate;
        
        const firstBatch = Math.min(maxConcurrency, rate);

        this.requestClient.generateRequests(firstBatch);
    }
}

module.exports = Scheduler;
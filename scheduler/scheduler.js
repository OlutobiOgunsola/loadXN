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
            const requestsDeficit = this.getSchedulingDemand();

            this.appMetrics.write(
                `active: ${this.appState.activeRequests}, :::::: started: ${this.appState.totalStarted}, :::::: completed: ${this.appState.totalCompleted}, :::::: expected: ${Date.now() - this.appState.initTS}, :::::: dispatch: ${this.requestsDeficit}`,
                './metrics.csv',
                true
            )

            this.requestClient.generateRequests(requestsDeficit);
        })
    };

    getSchedulingDemand() {
        const elapsed = Date.now() - this.appState.initTS;

        console.log(`${Math.floor(elapsed / 1000)}seconds running ::::::::::::: `)

        if(elapsed >= this.appState.duration) {
            console.log("Breaking Load Test :::::::: ")
            this.appState.breakLoadTest();
        }

        const expectedRequests = Math.ceil(elapsed * this.appState.rate / 1000);
        
        const rateDemand = Math.max(0, expectedRequests - this.appState.totalStarted);

        const availableConcurrency = this.appState.maxConcurrency - this.appState.activeRequests;

        const demand = Math.min(availableConcurrency, rateDemand);
        
        console.log({
            elapsed,
            expectedRequests,
            totalStarted: this.appState.totalStarted,
            availableConcurrency
        });

        return demand;
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
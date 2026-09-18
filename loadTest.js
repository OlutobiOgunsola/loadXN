const Scheduler = require('./scheduler/index');
const State = require('./state');
const HttpClient = require('./http');
const Metrics = require('./metrics');

const URL = 'http://localhost:7201/health';

class LoadTest {
    constructor({duration, rate, maxConcurrency}) {
        this.duration = duration;
        this.rate = rate;
        this.maxConcurrency = maxConcurrency;

        this.metrics = new Metrics({
            outputURL: './output.csv',
            outputFormat: 'csv',
        });
        this.state = new State({
            duration,
            rate,
            maxConcurrency
        });
        this.httpClient = new HttpClient(URL, 'get');
        this.scheduler = new Scheduler(
            this.state,
            this.httpClient,
            this.metrics
        );
    }

    run() {
        this.scheduler.runLoadTest();
    }
}

module.exports = LoadTest;
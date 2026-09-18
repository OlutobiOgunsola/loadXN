const fs = require('fs');
const eventBus = require('../events');

class Metrics {
    constructor({
        outputURL,
        outputFormat,
    }) {
        const outputPath = outputURL || `./output-${Date.now()}.csv`;

        this.outputFile = fs.createWriteStream(outputPath, {
            flags: 'w'
        });

        const rateBuckets = [];

        this.outputFile.write('Duration, Message, Code \n');

        this.metricsStartTime = performance.now();

        this.startBuckets = [];
        this.latencies = [];

        eventBus.on('requestCompleted', ({
            duration, message, code
        }) => {
            this.latencies.push(duration);
            this.outputFile.write(`${duration}, ${message}, ${code} \n`);
        })

        eventBus.on('testCompleted', ({ totalStarted, initTS }) => {
            function percentile(values, percentile) {
                const sorted = [...values].sort((a, b) => a - b);
            
                const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            
                return sorted[index];
            }

            const p50 = percentile(this.latencies, 50);
            const p90 = percentile(this.latencies, 90);
            const p95 = percentile(this.latencies, 95);
            const p99 = percentile(this.latencies, 99);
            const max = Math.max(...this.latencies);

            const completedBuckets = this.startBuckets.slice(0, -1);

            const average = completedBuckets.reduce((sum, latency) => sum + latency, 0) / completedBuckets.length; // hacky. take this out

            const report = `
                Requests   ::::::::::  ${totalStarted}
                Throughput ::::::::::  ${average} requests/second
                Runtime    ::::::::::  ${Math.floor((Date.now() - Math.floor(initTS)) / 1000)} seconds

                REQUESTS_STARTED_PER_SECOND ::::::::::::: [${this.startBuckets}]

                ++++++++++++++++++++++++++++++++++++++++++++++++++=

                Latency

                P50        :::::::::   ${p50} |
                P90        :::::::::   ${p90} |
                P95        :::::::::   ${p95} |
                P99        :::::::::   ${p99} |
                max        :::::::::   ${max} |
            `

            this.write(report, './load-test-report.txt', false);
        })

        eventBus.on('requestStarted', ({
            startedAt
        }) => {
            const elapsed = startedAt - this.metricsStartTime;
            const bucket = Math.floor(elapsed / 1000);
            const requestAssignedBucket = this.startBuckets[bucket] || 0;
            this.startBuckets[bucket] = requestAssignedBucket + 1;
        })
    }

    write(data, path, shouldConcatenate) {
        const file = fs.createWriteStream(path, {
            flags: shouldConcatenate ? 'a' : 'w'
        });
        file.write(`${data} \n`)
    };
}

module.exports = Metrics;
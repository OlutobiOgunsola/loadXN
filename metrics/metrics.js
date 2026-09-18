const fs = require('fs');
const eventBus = require('../events');
const { percentile } = require('../lib/math.util');
class Metrics {
    constructor({
        outputURL,
        outputFormat,
        initTS
    }) {
        const outputPath = outputURL || `./output-${Date.now()}.csv`;

        this.outputFile = fs.createWriteStream(outputPath, {
            flags: 'w'
        });

        this.outputFile.write('Duration, Message, Code \n');

        this.metricsStartTime = performance.now();

        this.startBuckets = [];
        this.codeBuckets = {};
        this.latencies = [];
        this.initTS = initTS;

        eventBus.on('requestCompleted', ({
            duration, message, code
        }) => {
            this.latencies.push(duration);
            this.outputFile.write(`${duration}, ${message}, ${code} \n`);
            this.codeBuckets[code] =
                (this.codeBuckets[code] || 0) + 1;
        })

        eventBus.on('testCompleted', (testData) => {
            return this.generateReport(testData)
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

    generateReport({ totalStarted }) {
        const p50 = percentile(this.latencies, 50);
        const p90 = percentile(this.latencies, 90);
        const p95 = percentile(this.latencies, 95);
        const p99 = percentile(this.latencies, 99);
        const max = Math.max(...this.latencies);

        const runTime = (Date.now() - this.initTS) / 1000; // runtime in s

        const throughput = totalStarted / runTime;

        const responseCodeDistribution =
            Object.entries(this.codeBuckets)
                .map(([code, count]) => `${code}: ${count}`)
                .join('\n');

        const report = `
            Requests   ::::::::::  ${totalStarted}
            Throughput ::::::::::  ${throughput} requests/second
            Runtime    ::::::::::  ${runTime} seconds

            REQUESTS_STARTED_PER_SECOND ::::::::::::: [${this.startBuckets}]
            RESPONSE_CODES_DISTRIBUTION :::::::::::::

            ${responseCodeDistribution}

            ++++++++++++++++++++++++++++++++++++++++++++++++++=

            Latency

            P50        :::::::::   ${p50} |
            P90        :::::::::   ${p90} |
            P95        :::::::::   ${p95} |
            P99        :::::::::   ${p99} |
            max        :::::::::   ${max} |
        `

        this.write(report, './load-test-report.txt', false);
        // this.outputFile.end();
    }
}

module.exports = Metrics;
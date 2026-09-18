const LoadTest = require('./loadTest');

const DURATION = 5000; // duration in MS. This will be gotten from the CLI REPL
const RATE = 3000; // req/s rate. This will be gotten from the CLI REPL
const MAX_CONCURRENCY = 5500;

const config = {
    duration: DURATION,
    rate: RATE,
    maxConcurrency: MAX_CONCURRENCY,
}

const loadTest = new LoadTest(config);

loadTest.run();
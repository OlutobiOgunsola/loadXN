function percentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[index];
}

module.exports = {
    percentile
}
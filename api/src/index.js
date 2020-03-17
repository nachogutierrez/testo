const PORT = process.env.PORT || 8080

const { Server } = require('./server')
const { MemoryStorage } = require('./results')
const { Metrics } = require('./metrics/metricService')

const app = Server({
    resultService: MemoryStorage(),
    metricsService: Metrics({ uri: process.env.METRICS_DB_URI })
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
})

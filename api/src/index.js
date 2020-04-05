const PORT = process.env.PORT || 8080

const { Server } = require('./server')
const { MemoryResultService, PostgresResultService } = require('./results')
const { PostgresMetricService } = require('./metrics/postgresMetricService')

const app = Server({
    resultService: PostgresResultService({ uri: process.env.TESTO_DB_URI || 'postgresql://postgres:postgres@localhost:8888/testo' }),
    metricService: PostgresMetricService({ uri: process.env.METRICS_DB_URI })
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
})

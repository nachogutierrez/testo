// Load configuration in env.json
try {
    const envConf = require('../env.json')
    for (const key of Object.keys(envConf)) {
        process.env[key] = envConf[key]
    }
} catch(e) {
    console.log('env.json not found')
}

const fs = require('fs').promises
const elasticsearch = require('@elastic/elasticsearch')
const { Server } = require('./server')
const { MemoryResultService, PostgresResultService } = require('./results')
const { PostgresMetricService } = require('./metrics/postgresMetricService')
const { firebase } = require('./firebase')



async function main() {

    const PORT = process.env.PORT || 5000

    const app = Server({
        resultService: PostgresResultService({ uri: process.env.TESTO_DB_URI || 'postgresql://postgres:postgres@localhost:8888/testo2' }),
        metricService: PostgresMetricService({ uri: process.env.METRICS_DB_URI }),
        searchService: new elasticsearch.Client({ node: process.env.ELASTICSEARCH_URI || 'http://localhost:9200' }),
        firebase
    })

    app.listen(PORT, () => {
        console.log(`app listening on port ${PORT}`);
    })

}

main()

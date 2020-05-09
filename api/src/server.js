const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const Server = function({ resultService, metricService }) {
    const app = express()
    app.use(bodyParser.json())
    app.use(cors())

    const { measureMax, pushCounterMetric } = metricService

    app.post('/query/workload', async (req, res) => {
        try {
            await measureMax('query-workload-time', async () => {
                res.json(await resultService.getWorkloads(req.body))
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching workloads', exception: e.message })
            pushCounterMetric('query-workload-failed')
        } finally {
            pushCounterMetric('query-workload')
        }
    })

    app.post('/create/workload', async (req, res) => {
        try {
            await measureMax('create-workload-time', async () => {
                const data = await resultService.createWorkloads(req.body)
                res.json(data)
            })
        } catch(e) {
            res.status(400).json({ message: 'error creating workloads', exception: e.message })
            pushCounterMetric('create-workload-failed')
        } finally {
            pushCounterMetric('create-workload')
        }
    })

    app.post('/query/result', async (req, res) => {
        res.json(await resultService.getResults(req.body))
    })

    app.post('/create/result', async (req, res) => {
        res.json(await resultService.createResults(req.body))
    })

    return app
}

module.exports = {
    Server
}

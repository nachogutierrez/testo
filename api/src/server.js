const express = require('express')
const bodyParser = require('body-parser')

const Server = function({ resultService, metricService }) {
    const app = express()
    app.use(bodyParser.json())

    const { measureMax, pushCounterMetric } = metricService

    app.post('/query/workload', async (req, res) => {
        try {
            await measureMax('query-workload-time', async () => {
                res.json(await resultService.getWorkloads(req.body))
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching workloads', exception: e.message })
        } finally {
            pushCounterMetric('query-workload-rps')
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
        } finally {
            pushCounterMetric('count-create-workload-rps')
        }
    })

    app.post('/query/result', async (req, res) => {
        res.json(await resultService.getResults(req.body))
    })

    app.post('/create/result', async (req, res) => {
        // console.log('creating results');
        res.json(await resultService.createResults(req.body))
    })

    return app
}

module.exports = {
    Server
}

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const uuid = require('uuid').v4

const Server = function({ resultService, metricService, firebase }) {
    const app = express()
    app.use(bodyParser.json())
    app.use(cors())

    const { measureMax, pushCounterMetric } = metricService

    app.post('/query/workload', async (req, res) => {
        const u = uuid()
        console.time(`${u} - /query/workload`)
        try {
            await measureMax('query-workload-time', async () => {
                const workloads = await resultService.getWorkloads(req.body)
                res.json(workloads)
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching workloads', exception: e.message })
            pushCounterMetric('query-workload-failed')
        } finally {
            pushCounterMetric('query-workload')
            console.timeEnd(`${u} - /query/workload`)
        }
    })

    app.post('/create/workload', async (req, res) => {
        const u = uuid()
        console.time(`${u} - /create/workload`)
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
            console.timeEnd(`${u} - /create/workload`)
        }
    })

    app.post('/query/result', async (req, res) => {
        res.json(await resultService.getResults(req.body))
    })

    app.post('/create/result', async (req, res) => {
        res.json(await resultService.createResults(req.body))
    })

    /*
    * Query metadata values based on filters
    */
    app.post('/metadata/keys', async (req, res) => {
        res.json(await resultService.metadataKeys(req.body))
    })

    /*
    * Query metadata values based on filters
    */
    app.post('/metadata/values', async (req, res) => {
        res.json(await resultService.metadataValues(req.body))
    })

    app.get('/files/:id', async (req, res) => {
        const u = uuid()
        console.time(`${u} - /files/:id`)
        const bucket = firebase.storage().bucket()
        const workloadId = req.params.id
        const data = await bucket.getFiles({
            directory: `testo/workloads/${workloadId}/files`
        })
        const firebaseFiles = data[0]

        const promises = []

        const files = firebaseFiles.map(ff => ({ name: ff.name }))
        for (const file of files) {
            promises.push(async () => {
                const url = await bucket.file(file.name).getSignedUrl({
                    action: 'read',
                    expires: '12-12-2020'
                })
                return {
                    name: file.name,
                    url: url[0]
                }
            })
        }

        const resolvedPromises = await Promise.all(promises.map(f => f()))

        console.timeEnd(`${u} - /files/:id`)
        res.json(resolvedPromises)
    })

    app.get('/stacktraces/:id', async (req, res) => {
        const u = uuid()
        console.time(`${u} - /stacktraces/:id`)
        const bucket = firebase.storage().bucket()
        const resultId = req.params.id
        const data = await bucket.getFiles({
            directory: `testo/results/${resultId}/stacktraces`
        })
        const firebaseFiles = data[0]

        const promises = []

        const files = firebaseFiles.map(ff => ({ name: ff.name }))
        for (const file of files) {
            promises.push(async () => {
                const url = await bucket.file(file.name).getSignedUrl({
                    action: 'read',
                    expires: '12-12-2020'
                })
                return {
                    name: file.name,
                    url: url[0]
                }
            })
        }

        const resolvedPromises = await Promise.all(promises.map(f => f()))

        console.timeEnd(`${u} - /stacktraces/:id`)
        res.json(resolvedPromises)
    })

    return app
}

module.exports = {
    Server
}

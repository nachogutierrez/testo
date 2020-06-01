const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const uuid = require('uuid').v4
const moment = require('moment')

const crypto = require('crypto')
const hash = (s, algo='md5') => crypto.createHash(algo).update(s).digest("hex")

const Server = function({ resultService, metricService, searchService, firebase }) {
    const app = express()
    app.use(bodyParser.json())
    app.use(cors())

    const { measureMax, pushCounterMetric } = metricService

    app.post('/query/workload', async (req, res) => {
        try {
            await measureMax('query-workload-time', async () => {
                const workloads = await resultService.getWorkloads(req.body)
                res.json(workloads)
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching workloads', exception: e.message })
            pushCounterMetric('query-workload-failed-rpm')
        } finally {
            pushCounterMetric('query-workload-rpm')
        }
    })

    function workloadInsights(workloads = []) {
        const emptyCount = () => ({
            pass: 0,
            fail: 0,
            skip: 0,
            error: 0
        })

        const insights = {
            totalWorkloads: 0,
            totalResults: 0,
            pass: 0,
            fail: 0,
            count: emptyCount(),
            byDate: {}
        }

        for (const workload of workloads) {
            const date = moment(workload.created_at).format('YYYY-MM-DD')
            if (!insights.byDate[date]) insights.byDate[date] = {
                totalWorkloads: 0,
                totalResults: 0,
                pass: 0,
                fail: 0,
                count: emptyCount()
            }

            insights.totalWorkloads++
            insights.byDate[date].totalWorkloads++

            insights.count.pass += workload.pass
            insights.byDate[date].count.pass += workload.pass

            insights.count.fail += workload.fail
            insights.byDate[date].count.fail += workload.fail

            insights.count.skip += workload.skip
            insights.byDate[date].count.skip += workload.skip

            insights.count.error += workload.error
            insights.byDate[date].count.error += workload.error

            insights.totalResults += workload.pass + workload.fail + workload.skip + workload.error
            insights.byDate[date].totalResults += workload.pass + workload.fail + workload.skip + workload.error

            if (workload.fail > 0 || workload.error > 0) {
                insights.fail++
                insights.byDate[date].fail++
            } else {
                insights.pass++
                insights.byDate[date].pass++
            }
        }

        return insights
    }

    app.post('/query/workload/insights', async (req, res) => {
        try {
            await measureMax('query-workload-insights-time', async () => {
                const workloads = await resultService.getWorkloads(req.body)
                res.json(workloadInsights(workloads))
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching workload insights', exception: e.message })
            pushCounterMetric('query-workload-insights-failed-rpm')
        } finally {
            pushCounterMetric('query-workload-insights-rpm')
        }
    })

    app.post('/create/workload', async (req, res) => {
        try {
            await measureMax('create-workload-time', async () => {
                req.body.kind = hash(req.body.kind)
                const data = await resultService.createWorkload(req.body)
                console.time(`${u} - indexing metadata`)
                await searchService.indexWorkloadMetadata(req.body)
                console.timeEnd(`${u} - indexing metadata`)
                res.json(data)
            })
        } catch(e) {
            console.error(e)
            res.status(400).json({ message: 'error creating workloads', exception: e.message })
            pushCounterMetric('create-workload-failed-rpm')
        } finally {
            pushCounterMetric('create-workload-rpm')
        }
    })

    app.post('/query/result', async (req, res) => {
        try {
            await measureMax('query-result-time', async () => {
                const results = await resultService.getResults(req.body)
                res.json(results)
            })
        } catch(e) {
            res.status(400).json({ message: 'error fetching results', exception: e.message })
            pushCounterMetric('query-result-failed-rpm')
        } finally {
            pushCounterMetric('query-result-rpm')
        }
    })

    app.post('/create/result', async (req, res) => {
        const u = uuid()
        console.time(`${u} - /create/result`)

        const workloadId = req.body[0].workloadId
        const workload = (await resultService.getWorkloads({ id: workloadId }))[0]

        try {
            await measureMax('create-result-time', async () => {
                for (const result of req.body) {
                    result.kind = hash(`${workload.kind}-${result.kind}`)
                }
                const data = await resultService.createResults(req.body)

                console.time(`${u} - indexing metadata`)
                await searchService.indexResultMetadata(workload, req.body)
                console.timeEnd(`${u} - indexing metadata`)
                res.json(data)
            })
        } catch(e) {
            res.status(400).json({ message: 'error creating results', exception: e.message })
            pushCounterMetric('create-result-failed-rpm')
        } finally {
            pushCounterMetric('create-result-rpm')
            console.timeEnd(`${u} - /create/result`)
        }
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

    app.post('/suggestions', async (req, res) => {
        res.json(await searchService.suggestions(req.body))
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

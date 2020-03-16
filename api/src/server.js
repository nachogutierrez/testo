const express = require('express')
const bodyParser = require('body-parser')

const Server = function({ resultService }) {
    const app = express()
    app.use(bodyParser.json())

    app.post('/query/workload', async (req, res) => {
        try {
            res.json(await resultService.getWorkloads(req.body))
        } catch(e) {
            res.status(400).json({ message: 'error fetching workloads', exception: e })
        }
    })

    app.post('/create/workload', async (req, res) => {
        // console.log('creating workload');
        try {
            res.json(await resultService.createWorkloads(req.body))
        } catch(e) {
            res.status(400).json({ message: 'error creating workloads', exception: e.message })
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

const { Pool, Client } = require('pg')

const query = async (pool, statement) => new Promise((resolve, reject) => {
    pool.query(statement, (err, res) => {
        if (err) {
            return reject(err)
        }

        resolve(res)
    })
})

const sleep = millis => new Promise((resolve, reject) => setTimeout(resolve, millis))

const Metrics = function({ uri, pushInterval=1000 }) {

    let pool
    let stopped = false
    let queue = {}

    if (uri) {
        pool = new Pool({
            connectionString: uri
        })
    }

    async function loop() {
        if (stopped) return

        const savedQueue = queue
        queue = {}
        const metricNames = Object.keys(savedQueue)
        const promises = []
        for (let i = 0; i < metricNames.length; i++) {
            const metricName = metricNames[i]
            let value
            const metric = savedQueue[metricName]
            switch(metric.type) {
                case 'avg':
                    value = Math.ceil(metric.accum/metric.count)
                break
                case 'max':
                    value = metric.value
                break
                case 'counter':
                    value = metric.value
                break
                default:
                throw new Error(`Invalid metric type: ${savedQueue[metricName].type}`)
            }

            promises.push(() => (
                query(pool, `insert into datapoint (name, value) values ('${metricName}', ${value})`)
            ))
        }
        if (promises.length > 0 && !pool) {
            console.log('[INFO] metrics not pushed, no connection to metrics database')
        }
        if (pool) {
            await Promise.all(promises.map(f => f()))
        }
        await sleep(pushInterval)
        loop()
    }

    function pushMaxMetric(metricName, value) {
        if (!queue[metricName] || queue[metricName].type !== 'max' || !queue[metricName].value) {
            queue[metricName] = { type: 'max', value: 0 }
        }
        queue[metricName].value = Math.max(queue[metricName].value, value)
    }

    function pushAvgMetric(metricName, value) {
        if (!queue[metricName] || queue[metricName].type !== 'avg' || !queue[metricName].accum || !queue[metricName].count) {
            queue[metricName] = { type: 'avg', accum: 0, count: 0 }
        }
        queue[metricName].accum += value
        queue[metricName].count += 1
    }

    function pushCounterMetric(metricName) {
        if (!queue[metricName] || queue[metricName].type !== 'counter' || !queue[metricName].value) {
            queue[metricName] = { type: 'counter', value: 0 }
        }
        queue[metricName].value += 1
    }

    async function measureMax(metricName, handler) {
        return await measure(metricName, pushMaxMetric, handler)
    }

    async function measureAvg(metricName, handler) {
        return await measure(metricName, pushAvgMetric, handler)
    }

    async function measure(metricName, metricPush, handler) {
        const start = Date.now()
        const ret = await handler() // if handler fails, metric won't be published
        const end = Date.now()
        const elapsed = (end - start)


        metricPush(metricName, elapsed)

        return ret
    }

    async function stop() {
        stopped = true
        await pool.end()
    }

    loop()

    return {
        measureMax,
        measureAvg,
        pushMaxMetric,
        pushAvgMetric,
        pushCounterMetric
    }
}

module.exports = {
    Metrics
}

const Testo = function({ api }) {

    const cache = {
        getFiles: {},
        getStacktraces: {}
    }

    async function queryWorkloads(payload = {}) {
        if (!payload.limit) payload.limit = 20
        if (!payload.page) payload.page = 1
        payload.skip = (payload.page - 1) * payload.limit

        const response = await fetch(`${api}/query/workload`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const workloads = await response.json()
        return workloads
    }

    async function queryWorkloadInsights(payload = {}) {
        if (!payload.limit) payload.limit = 1000
        if (!payload.page) payload.page = 1
        if (!payload.since) payload.since = moment().subtract(30, 'days').format('YYYY/MM/DD')
        payload.skip = (payload.page - 1) * payload.limit

        const response = await fetch(`${api}/query/workload/insights`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const insights = await response.json()
        return insights
    }

    async function queryResults(payload = {}) {
        if (!payload.limit) payload.limit = 20
        if (!payload.page) payload.page = 1
        payload.skip = (payload.page - 1) * payload.limit

        const response = await fetch(`${api}/query/result`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const workloads = await response.json()
        return workloads
    }

    async function getFiles(payload = {}) {
        if (!payload.workloadId) {
            throw new Error('Testo.getFiles() requires a workload id')
        }
        if (cache.getFiles[payload.workloadId]) {
            return cache.getFiles[payload.workloadId]
        }

        const response = await fetch(`${api}/files/${payload.workloadId}`)
        const files = await response.json()
        cache.getFiles[payload.workloadId] = files
        return files
    }

    async function getStacktraces(payload = {}) {
        if (!payload.resultId) {
            throw new Error('Testo.getStacktraces() requires a result id')
        }
        if (cache.getStacktraces[payload.resultId]) {
            return cache.getStacktraces[payload.resultId]
        }

        const response = await fetch(`${api}/stacktraces/${payload.resultId}`)
        const stacktraces = await response.json()
        for (const stacktrace of stacktraces) {
            stacktrace.name = stacktrace.name.split('/').pop()
            const stResponse = await fetch(stacktrace.url)
            const contents = await stResponse.text()
            stacktrace.value = contents
        }
        cache.getStacktraces[payload.resultId] = stacktraces
        return stacktraces
    }

    async function getMetadataKeys(payload = {}) {
        const response = await fetch(`${api}/metadata/keys`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const keys = await response.json()
        return keys
    }

    async function getMetadataValues(payload = {}) {
        if (!payload.key) {
            throw new Error(`getColumnOptions() requires a key`)
        }
        const response = await fetch(`${api}/metadata/values`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const values = await response.json()
        return values
    }

    async function suggestions(payload = {}) {
        if (!payload.query) {
            throw new Error(`suggestions() requires a query`)
        }

        const response = await fetch(`${api}/suggestions`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const data = await response.json()
        return data
    }

    return {
        queryWorkloads,
        queryWorkloadInsights,
        queryResults,
        getFiles,
        getStacktraces,
        getMetadataKeys,
        getMetadataValues,
        suggestions
    }
}

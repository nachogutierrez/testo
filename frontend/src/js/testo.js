const Testo = function({ api }) {

    const cache = {
        getFiles: {},
        getStacktraces: {}
    }

    async function queryWorkloads(payload = {}) {
        if (!payload.limit) payload.limit = 8
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

    async function queryResults(payload = {}) {
        if (!payload.limit) payload.limit = 8
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

    return {
        queryWorkloads,
        queryResults,
        getFiles,
        getStacktraces
    }
}

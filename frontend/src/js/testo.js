const Testo = function({ api }) {

    const cache = {
        getFiles: {}
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

    return {
        queryWorkloads,
        queryResults,
        getFiles
    }
}

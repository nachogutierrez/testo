const Testo = function({ api }) {

    async function queryWorkloads(payload = {}) {
        if (!payload.limit) payload.limit = 10

        const response = await fetch(`${api}/query/workload`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const workloads = await response.json()
        return workloads
    }

    async function queryResults(payload = {}) {
        if (!payload.limit) payload.limit = 10

        const response = await fetch(`${api}/query/result`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const workloads = await response.json()
        return workloads
    }

    return {
        queryWorkloads,
        queryResults
    }
}
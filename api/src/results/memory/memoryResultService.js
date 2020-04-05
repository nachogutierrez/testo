const { v4: generateUuid } = require('uuid')

const MemoryResultService = function() {

    let workloads = {}
    let results = {}

    async function getWorkloads(opts = {}) {
        if (opts.uuid !== undefined) return [workloads[opts.uuid]].filter(passesFilter(opts))
        return Object.values(workloads).filter(passesFilter(opts))
    }

    async function getResults(opts = {}) {
        if (opts.uuid !== undefined) return [results[opts.uuid]].filter(passesFilter(opts))
        return Object.values(results).filter(passesFilter(opts))
    }

    async function createWorkloads(opts = []) {
        const created = opts.map(o => ({
             uuid: generateUuid(),
             ...o
        }))
        created.forEach(o => {
            workloads[o.uuid] = o
        })
        return created
    }

    async function createResults(opts = []) {
        const created = opts.map(o => ({
             uuid: generateUuid(),
             ...o
        }))
        created.forEach(o => {
            results[o.uuid] = o
        })
        return created
    }

    return {
        getWorkloads,
        getResults,
        createWorkloads,
        createResults
    }
}

const passesFilter = (filter = {}) => (obj = {}) => {
    const keys = Object.keys(filter)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (typeof(filter[key]) === 'string') {
            if (filter[key] !== obj[key]) return false
        } else if (typeof(filter[key]) === 'object') {
            if (typeof(obj[key]) !== 'object' || !passesFilter(filter[key])(obj[key])) return false
        }
    }
    return true
}

module.exports = {
    MemoryResultService,
    passesFilter
}

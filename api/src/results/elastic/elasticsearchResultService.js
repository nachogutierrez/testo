const elasticsearch = require('@elastic/elasticsearch')
const moment = require('moment')

const DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss'

function now() {
    return moment().format(DATE_FORMAT)
}

const ElasticsearchResultService = function({ elasticUri, sqlUri }) {

    const elasticClient = new elasticsearch.Client({ node: elasticUri })

    async function getWorkloads(opts = {}) {
        const exists = await elasticClient.indices.exists({ index: 'workloads' })
        if (!exists.body) return []

        const { id, kind, metadata = {}, limit = 100, skip = 0, since, until } = opts

        let rangeQuery = undefined
        if (since || until) {
            rangeQuery = { range: { created_at: {} } }
            if (since) {
                rangeQuery.range.created_at.gte = since
            }
            if (until) {
                rangeQuery.range.created_at.lte = until
            }
        }

        const payload = {
            index: 'workloads',
            body: {
                query: {
                    bool: {
                        must: [
                            rangeQuery,
                            id ? { ids: { values: [ id ] } } : undefined,
                            kind ? { term: { 'kind.keyword': kind } } : undefined,
                            ...termQueries(metadata)
                        ].filter(x => x)
                    }
                },
                sort: { created_at: { order: 'desc' } },
                from: skip,
                size: limit
            }
        }

        const response = await elasticClient.search(payload)
        const workloads = response.body.hits.hits.map(h => ({ ...h._source, id: h._id }))
        return workloads

    }

    async function getResults(opts = {}) {
        const exists = await elasticClient.indices.exists({ index: 'results' })
        if (!exists.body) return []

        const { id, kind, status, metadata = {}, workloadId, workloadKind, workloadMetadata, limit = 100, skip = 0, since, until } = opts

        let rangeQuery = undefined
        if (since || until) {
            rangeQuery = { range: { created_at: {} } }
            if (since) {
                rangeQuery.range.created_at.gte = since
            }
            if (until) {
                rangeQuery.range.created_at.lte = until
            }
        }

        const payload = {
            index: 'results',
            body: {
                query: {
                    bool: {
                        must: [
                            rangeQuery,
                            id ? { ids: { values: [ id ] } } : undefined,
                            kind ? { term: { 'kind.keyword': kind } } : undefined,
                            status ? { term: { 'status.keyword': status } } : undefined,
                            workloadId ? { term: { 'workloadId.keyword': workloadId } } : undefined,
                            workloadKind ? { term: { 'workloadKind.keyword': workloadKind } } : undefined,
                            ...termQueries(metadata)
                        ].filter(x => x)
                    }
                },
                sort: { created_at: { order: 'desc' } },
                from: skip,
                size: limit
            }
        }

        const response = await elasticClient.search(payload)

        return response.body.hits.hits.map(h => ({ ...h._source, id: h._id }))
    }

    async function createWorkload(opts = {}) {
        let { id, kind, metadata = {}, created_at = now() } = opts
        const response = await elasticClient.index({
            id,
            index: 'workloads',
            refresh: true,
            body: {
                kind,
                metadata,
                created_at,
                count: {
                    pass: 0,
                    fail: 0,
                    skip: 0
                }
            }
        })

        const ans = { id: response.body._id, kind, metadata, created_at }

        return ans
    }

    async function createResults(opts = []) {
        if (opts.length === 0) return []

        const { workloadId } = opts[0]
        const workload = (await getWorkloads({ id: workloadId }))[0]
        const workloadKind = workload.kind
        const count = {
            pass: 0,
            fail: 0,
            skip: 0
        }

        const body = []
        for (const result of opts) {
            const { id, kind, status, duration, metadata, created_at = now() } = result
            count[status]++
            body.push({ index: { _index: 'results', _id: id } })
            body.push({ kind, status, duration, metadata, workloadId, workloadKind, workloadMetadata: workload.metadata, created_at })
        }

        const response = await elasticClient.bulk({ refresh: true, body })
        await elasticClient.update({
            index: 'workloads',
            id: workloadId,
            body: {
                script: {
                    lang: 'painless',
                    source: 'ctx._source.count.pass += params.pass; ctx._source.count.fail += params.fail; ctx._source.count.skip += params.skip',
                    params: count
                }
            }
        })
        return response.body.items.map(item => item.index._id)
    }

    function termQueries(metadata) {
        return Object.keys(metadata).map(key => ({ term: { [`metadata.${key}.keyword`]: metadata[key] } }))
    }

    return {
        getWorkloads,
        getResults,
        createWorkload,
        createResults
    }
}

module.exports = {
    ElasticsearchResultService
}

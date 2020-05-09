const { Pool } = require('pg')
const { query } = require('../../util')

const buildGetWorkloadsStatement = ({ kind, metadata = {}, limit = 100, skip = 0, since, until }) => (`
    select workload.id, workload.kind, workload.created_at from workload inner join workload_metadata on workload.id = workload_metadata.workload_id
    ${renderClause('where', joinConditions([where('workload.kind', '=', kind), where('workload.created_at', '>', since), where('workload.created_at', '<', until)]))}
    group by workload.id
    ${renderClause('having', Object.keys(metadata).map(k => havingKeyValue(k, metadata[k], 'workload_metadata')).join(' and '))}
    order by workload.created_at desc
    limit ${limit}
    offset ${skip};
`.trim())

const buildGetResultsStatement = ({ workloadId, kind, metadata = {}, limit = 100, skip = 0, since, until, status }) => (`
    select result.id, result.workload_id, result.kind, result.status, result.duration, result.created_at
    from result inner join result_metadata on result.id = result_metadata.result_id
    ${renderClause('where', joinConditions([where('result.kind', '=', kind), where('result.created_at', '>', since), where('result.created_at', '<', until), where('result.status', '=', status), where('result.workload_id', '=', workloadId)]))}
    group by result.id
    ${renderClause('having', Object.keys(metadata).map(k => havingKeyValue(k, metadata[k], 'result_metadata')).join(' and '))}
    order by result.created_at desc
    limit ${limit}
    offset ${skip};
`.trim())

const renderClause = (clause, conditions) => (conditions ? `${clause} ${conditions}` : '')
const where = (key, operator, value) => (value ? `${key} ${operator} '${value}'` : '')
const joinConditions = (conditions = []) => conditions.filter(c => c).join(' and ')
const havingKeyValue = (key, value, table) => `max(case when ${table}.key = '${key}' then ${table}.value end) = '${value}'`

const PostgresResultService = function({ uri }) {

    let pool
    if (uri) {
        pool = new Pool({
            connectionString: uri
        })
    }

    // TODO: investigate cache options
    async function getMetadata(id, table = 'workload') {
        const metadataList = (await query(pool, `select * from ${table}_metadata where ${table}_id = ${id}`)).rows
        const metadata = {}
        for (let i = 0; i < metadataList.length; i++) {
            const { key, value } = metadataList[i]
            metadata[key] = value
        }
        return metadata
    }

    const enhanceWithMetadata = table => async (item) => ({
        ...item,
        metadata: await getMetadata(item.id, table)
    })

    async function getWorkloads(opts = {}) {
        const { id, kind, metadata = {}, limit = 100, skip = 0, since, until } = opts

        if (id) {
            return await Promise.all((await query(pool, `select * from workload where id='${id}'`)).rows.map(enhanceWithMetadata('workload')))
        }

        return await Promise.all((await query(pool, buildGetWorkloadsStatement({ kind, metadata, limit, skip, since, until }))).rows.map(enhanceWithMetadata('workload')))
    }

    async function getResults(opts = {}) {
        const { id, workloadId, kind, metadata = {}, limit = 100, skip = 0, since, until, status } = opts

        if (id) {
            // TODO: fetch metadata
            return await Promise.all((await query(pool, `select * from result where id='${id}'`)).rows.map(enhanceWithMetadata('result')))
        }

        // TODO: fetch metadata
        return await Promise.all((await query(pool, buildGetResultsStatement({ workloadId, kind, metadata, limit, skip, since, until, status }))).rows.map(enhanceWithMetadata('result')))
    }

    async function createWorkloads(opts = []) {

        // TODO: add workloads to response
        const workloads = []
        for (let i = 0; i < opts.length; i++) {
            const w = opts[i]
            const { kind = 'undefined', metadata = {} } = w
            const response = await query(pool, `insert into workload (kind) values ('${kind}') returning *`)
            const workloadId = response.rows[0].id
            const keys = Object.keys(metadata)
            const workload = {
                id: workloadId,
                kind: kind
            }
            const m = {}
            for (let j = 0; j < keys.length; j++) {
                const [key, value] = [keys[j], metadata[keys[j]]]
                const metadataResponse = await query(pool, `insert into workload_metadata (workload_id, key, value) values (${workloadId}, '${key}', '${value}') returning *`)
                const pair = metadataResponse.rows[0]
                m[pair.key] = pair.value
            }

            workload.metadata = m
            workloads.push(workload)
        }

        return workloads
    }

    async function createResults(opts = []) {

        // console.log(opts)

        // TODO: add results to response
        const results = []

        for (let i = 0; i < opts.length; i++) {
            const r = opts[i]
            const { workloadId, kind = 'undefined', status = 'pass', duration = 0, metadata = {} } = r
            const response = await query(pool, `insert into result (workload_id, kind, status, duration) values ($1, $2, $3, $4) returning *`, [workloadId, kind, status, duration])
            const resultId = response.rows[0].id
            const keys = Object.keys(metadata)
            const result = {
                workloadId,
                id: resultId,
                kind,
                status,
                duration
            }
            const m = {}
            for (let j = 0; j < keys.length; j++) {
                const [key, value] = [keys[j], metadata[keys[j]]]
                const metadataResponse = await query(pool, `insert into result_metadata (result_id, key, value) values ($1, $2, $3) returning *`, [resultId, key, value])
                const pair = metadataResponse.rows[0]
                m[pair.key] = pair.value
            }

            result.metadata = m
            results.push(result)
        }

        return results
    }

    return {
        getWorkloads,
        getResults,
        createWorkloads,
        createResults
    }
}

module.exports = {
    PostgresResultService
}

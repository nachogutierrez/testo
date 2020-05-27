const { Pool } = require('pg')
const format = require('pg-format')
const uuid = require('uuid').v4
const { query } = require('../../util')

const crypto = require('crypto')
const hash = (s, algo='md5') => crypto.createHash(algo).update(s).digest("hex")

const buildGetWorkloadsStatement = ({ kind, metadata = {}, limit = 100, skip = 0, since, until }) => (`
    select workload.id, workload.kind, to_char(workload.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, workload.pass, workload.fail, workload.skip, workload.error from workload inner join workload_metadata on workload.id = workload_metadata.workload_id
    ${renderClause('where', joinConditions([where('workload.kind', '=', kind), where('workload.created_at', '>', since), where('workload.created_at', '<', until)]))}
    group by workload.id
    ${renderClause('having', Object.keys(metadata).map(k => havingKeyValue(k, metadata[k], 'workload_metadata')).join(' and '))}
    order by workload.created_at desc
    limit ${limit}
    offset ${skip};
`.trim())

const buildGetResultsStatement = ({ workloadId, kind, metadata = {}, limit = 100, skip = 0, since, until, status }) => (`
    select result.id, result.workload_id, result.kind, result.status, result.duration, to_char(result.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
    from result inner join result_metadata on result.id = result_metadata.result_id
    ${renderClause('where', joinConditions([where('result.kind', '=', kind), where('result.created_at', '>', since), where('result.created_at', '<', until), where('result.status', '=', status), where('result.workload_id', '=', workloadId)]))}
    group by result.id
    ${renderClause('having', Object.keys(metadata).map(k => havingKeyValue(k, metadata[k], 'result_metadata')).join(' and '))}
    order by result.created_at desc
    limit ${limit}
    offset ${skip};
`.trim())

// receives workload kind
const buildGetWorkloadKeysStatement = ({ kind, limit = 8, skip = 0 }) => (`
    select distinct(workload_metadata.key) from workload
    inner join workload_metadata on workload.id = workload_metadata.workload_id
    ${renderClause('where', joinConditions([where('kind', '=', kind)]))}
    order by key
    limit ${limit}
    offset ${skip}
`.trim())

// receives workload kind
const buildGetResultKeysStatement = ({ kind, limit = 8, skip = 0 }) => (`
    select distinct(result_metadata.key) from result
    inner join result_metadata on result.id = result_metadata.result_id
    inner join workload on workload.id = result.workload_id
    ${renderClause('where', joinConditions([where('workload.kind', '=', kind)]))}
    order by key
    limit ${limit}
    offset ${skip}
`.trim())

// receives workload kind
const buildGetWorkloadValuesStatement = ({ kind, key, limit = 8, skip = 0 }) => (`
    select distinct(workload_metadata.value) from workload
    inner join workload_metadata on workload.id = workload_metadata.workload_id
    ${renderClause('where', joinConditions([where('kind', '=', kind), where('key', '=', key)]))}
    order by value
    limit ${limit}
    offset ${skip}
`.trim())

// receives workload kind
const buildGetResultValuesStatement = ({ kind, key, limit = 8, skip = 0 }) => (`
    select distinct(result_metadata.value) from result
    inner join result_metadata on result.id = result_metadata.result_id
    inner join workload on workload.id = result.workload_id
    ${renderClause('where', joinConditions([where('workload.kind', '=', kind), where('key', '=', key)]))}
    order by value
    limit ${limit}
    offset ${skip}
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
        const metadataList = (await query(pool, `select * from ${table}_metadata where ${table}_id = '${id}'`)).rows
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
            return await Promise.all((await query(pool, `select * from result where id='${id}'`)).rows.map(enhanceWithMetadata('result')))
        }

        return await Promise.all((await query(pool, buildGetResultsStatement({ workloadId, kind, metadata, limit, skip, since, until, status }))).rows.map(enhanceWithMetadata('result')))
    }

    // can only create one workload at a time, no batch process for workloads
    async function createWorkloads(opts = {}) {

        const workloadId = uuid()
        const metadataInserts = []

        let { kind = 'undefined', metadata = {} } = opts
        kind = hash(kind)
        await query(pool, format('insert into workload (id, kind) values %L', [ [workloadId, kind] ]))

        const keys = Object.keys(metadata)
        for (let j = 0; j < keys.length; j++) {
            const [key, value] = [keys[j], metadata[keys[j]]]
            metadataInserts.push([workloadId, key, value])
        }

        const insertMetadataStatement = format('insert into workload_metadata (workload_id, key, value) values %L', metadataInserts)
        await query(pool, insertMetadataStatement)

        return {
            id: workloadId,
            kind,
            metadata
        }
    }

    async function createResults(opts = []) {

        const results = []

        const resultInserts = []
        const metadataInserts = []


        // Assume all results are part of the same workload
        const wid = opts[0].workloadId
        const workloadKind = (await query(pool, `select kind from workload where id='${wid}'`)).rows[0].kind

        const statusCounter = {
            pass: 0,
            fail: 0,
            skip: 0
        }
        for (let i = 0; i < opts.length; i++) {
            const r = opts[i]
            let { id, workloadId, kind = 'undefined', status = 'pass', duration = 0, metadata = {} } = r
            if (workloadId !== wid) {
                throw new Error(`All results should belong to the same workload. Found ${wid} and ${workloadId}`)
            }
            if (!id) {
                id = uuid()
            }
            kind = hash(`${workloadKind}-${kind}`)
            resultInserts.push([id, workloadId, kind, status, duration])
            const keys = Object.keys(metadata)
            for (let j = 0; j < keys.length; j++) {
                const [key, value] = [keys[j], metadata[keys[j]]]
                metadataInserts.push([id, key, value])
            }
            statusCounter[status]++
        }

        const insertResultsStatement = format('insert into result (id, workload_id, kind, status, duration) values %L', resultInserts)
        await query(pool, insertResultsStatement)

        const insertMetadataStatement = format('insert into result_metadata (result_id, key, value) values %L', metadataInserts)
        await query(pool, insertMetadataStatement)

        for (const status of Object.keys(statusCounter)) {
            if (statusCounter[status] > 0) {
                await query(pool, `update workload set ${status} = ${status} + ${statusCounter[status]} where id = '${wid}'`)
            }
        }

        return results
    }

    async function metadataKeys(opts = {}) {
        const { type='workload', kind, limit, skip } = opts

        if (!['workload', 'result'].includes(type)) {
            throw new Error(`type has to be in ['workload', 'result']. got: ${type}`)
        }
        let statementGenerator
        if (type === 'workload') statementGenerator = buildGetWorkloadKeysStatement
        else statementGenerator = buildGetResultKeysStatement

        const statement = statementGenerator({ kind, limit, skip })
        const response = await query(pool, statement)
        return response.rows.map(r => r.key)
    }

    async function metadataValues(opts = {}) {
        const { type='workload', kind, key, limit, skip } = opts

        if (!['workload', 'result'].includes(type)) {
            throw new Error(`type has to be in ['workload', 'result']. got: ${type}`)
        }
        let statementGenerator
        if (type === 'workload') statementGenerator = buildGetWorkloadValuesStatement
        else statementGenerator = buildGetResultValuesStatement

        const statement = statementGenerator({ kind, key, limit, skip })
        const response = await query(pool, statement)
        return response.rows.map(r => r.value)
    }

    return {
        getWorkloads,
        getResults,
        createWorkloads,
        createResults,
        metadataKeys,
        metadataValues
    }
}

module.exports = {
    PostgresResultService
}

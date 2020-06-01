const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs').promises
const uuid = require('uuid').v4
const moment = require('moment')
const { admin } = require('../firebase')
const { createTempFile } = require('../tmp')
const parsers = require('../parser')

const bucket = admin.storage().bucket()

async function createWorkload(args) {
    let metadata
    try {
        metadata = JSON.parse(args.metadata)
    } catch(e) {
        console.error(`invalid metadata json:\n${args.metadata}`)
        throw e
    }

    if (args.created_at) {
        moment(args.created_at, 'YYYY-MM-DD HH:mm:ss', true) // validate format
    }
    const response = await axios.post(`${args.api}/create/workload`, {
        kind: args.kind,
        metadata,
        created_at: args.created_at
    })

    console.log(response.data.id)
}

async function publishResults(args) {
    if (!parsers[args.type]) {
        throw new Error(`unsupported parser type: ${args.type}`)
    }
    const parser = parsers[args.type]
    let parsed = await parseDirectory(parser, args.files)

    for (const p of parsed) {
        p.workloadId = args.id
        p.id = uuid()
        if (p.stacktraces.length > 0) {
            console.time(`${p.id} - upload stacktraces`)
            for (const stacktrace of p.stacktraces) {
                const [path, cb] = await createTempFile()
                await fs.writeFile(path, stacktrace.value)
                await bucket.upload(path, {
                    destination: `testo/results/${p.id}/stacktraces/${stacktrace.name}`,
                    gzip: true
                })
                cb()
            }
            console.timeEnd(`${p.id} - upload stacktraces`)
        }
    }

    if (args.created_at) {
        moment(args.created_at, 'YYYY-MM-DD HH:mm:ss', true) // validate format
        for (const r of parsed) {
            r.created_at = args.created_at
        }
    }

    console.time('publishResults')
    await axios.post(`${args.api}/create/result`, parsed)
    console.timeEnd('publishResults')
}

async function parseDirectory(parser, dir) {
    const fileNames = await fs.readdir(dir)
    let results = []

    for (fileName of fileNames) {
        const stat = await fs.lstat(`${dir}/${fileName}`)
        if (!stat.isFile()) {
            const other = await parseDirectory(parser, `${dir}/${fileName}`)
            results = [...results, ...other]
        } else if (parser.isParseable(fileName)) {
            console.log(`parsing ${dir}/${fileName}`)
            const parsed = await parser.parse(`${dir}/${fileName}`)
            results = [...results, ...parsed]
        }
    }

    return results
}

module.exports = {
    createWorkload,
    publishResults
}

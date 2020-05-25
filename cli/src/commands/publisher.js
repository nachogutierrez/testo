const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs').promises

const parsers = require('../parser')

async function createWorkload(args) {
    let metadata
    try {
        metadata = JSON.parse(args.metadata)
    } catch(e) {
        console.error(`invalid metadata json:\n${args.metadata}`)
        throw e
    }

    const response = await axios.post(`${args.api}/create/workload`, {
        kind: args.kind,
        metadata
    })

    console.log(response.data.id)
}

async function publishResults(args) {
    if (!parsers[args.type]) {
        throw new Error(`unsupported parser type: ${args.type}`)
    }
    const parser = parsers[args.type]
    let parsed = await parseDirectory(parser, args.files)

    // TODO: do something with stacktraces
    for (p of parsed) {
        p.stacktrace = undefined
        p.workloadId = args.id
    }

    const start = new Date().getTime()
    await axios.post(`${args.api}/create/result`, parsed)
    const finish = new Date().getTime()
    console.log(`successfully published results in ${finish - start}ms`)
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

const axios = require('axios')
const fs = require('fs').promises
const { hash, resultsDir } = require('./util')
const config = require('../config.json')

const args = process.argv.slice(2)
let workloadName = 'default_workload'
if (args.length > 0) {
    workloadName = args[0]
}

async function main() {
    const resultFiles = await fs.readdir(resultsDir())
    for (let i = 0; i < resultFiles.length; i++) {
        let { metadata, results } = require(`${resultsDir()}/${resultFiles[i]}`)
        metadata.name = workloadName

        // creates workload
        const response = await axios.post(`${config.api}/create/workload`, [
            {
                kind: hash(workloadName),
                metadata
            }
        ])

        results = results.map(r => {
            return {
                duration: r.duration,
                status: r.isSuccess ? 'pass' : 'fail',
                workloadId: response.data[0].id,
                kind: hash(`${workloadName}-${r.name}`),
                metadata: {
                    name: r.name
                }
            }
        })

        // creates results
        await axios.post(`${config.api}/create/result`, results)
    }
}

main()

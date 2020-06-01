const axios = require('axios')
const fs = require('fs').promises
const moment = require('moment')
const { hash, resultsDir } = require('./util')
const config = require('../config.json')

async function main() {
    const directories = await fs.readdir(resultsDir())
    for (let i = 0; i < directories.length; i++) {
        const directory = directories[i]
        const resultFiles = await fs.readdir(`${resultsDir()}/${directory}`)
        for (let j = 0; j < resultFiles.length; j++) {
            let { metadata, results, kind } = require(`${resultsDir()}/${directory}/${resultFiles[j]}`)

            // creates workload
            const response = await axios.post(`${config.api}/create/workload`, {
                kind,
                metadata,
                created_at: `${directory} 13:30:00`
            })

            results = results.map(r => {
                return {
                    duration: r.duration,
                    status: r.isSuccess ? 'pass' : 'fail',
                    workloadId: response.data.id,
                    kind: r.name,
                    metadata: {
                        name: r.name
                    }
                }
            })

            // // creates results
            await axios.post(`${config.api}/create/result`, results)

            console.log(`${directory} - ${j + 1}/${resultFiles.length} done`)
        }
    }
}

main()

const axios = require('axios')
const fs = require('fs').promises
const moment = require('moment')
const { hash, resultsDir } = require('./util')
const config = require('../config.json')

const DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss'

async function main() {
    const directories = await fs.readdir(resultsDir())
    for (let i = 0; i < directories.length; i++) {
        const directory = directories[i]
        const resultFiles = await fs.readdir(`${resultsDir()}/${directory}`)
        for (let j = 0; j < resultFiles.length; j++) {
            let { metadata, results, kind } = require(`${resultsDir()}/${directory}/${resultFiles[j]}`)

            const created_at = moment(directory).format(DATE_FORMAT)

            // creates workload
            const response = await axios.post(`${config.api}/create/workload`, {
                kind,
                metadata,
                created_at
            })

            let k = 0
            const N = 200
            while(true) {
                let current = results.slice(k * N, k * N + N)
                if (current.length === 0) break

                current = current.map(r => {
                    return {
                        duration: r.duration,
                        status: r.isSuccess ? 'pass' : 'fail',
                        workloadId: response.data.id,
                        kind: r.name,
                        metadata: {
                            name: r.name
                        },
                        created_at
                    }
                })

                // creates results
                await axios.post(`${config.api}/create/result`, current)
                k++
            }

            console.log(`${directory} - ${j + 1}/${resultFiles.length} done`)
        }
    }
}

main()

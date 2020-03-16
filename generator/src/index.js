const seedrandom = require('seedrandom')
const axios = require('axios')
const config = require('../config.json')

const sleep = millis => new Promise((resolve, reject) => {
    setTimeout(resolve, millis)
})

const randomBetween = (generator, leftInclusive, rightExclusive) => {
    return Math.floor(generator() * (rightExclusive - leftInclusive) + leftInclusive)
}

const generateString = (generator, n) => {
    const chars = []
    for (let i = 0; i < n; i++) {
        chars.push(String.fromCharCode(randomBetween(generator, 'a'.charCodeAt(0), 'z'.charCodeAt(0) + 1)))
    }
    return chars.join('')
}

const pick = (generator, list) => {
    const idx = randomBetween(generator, 0, list.length)
    return list[idx]
}

const take = (generator, list, n) => {
    shuffle(generator, list)
    return list.filter((_, i) => i < n)
}

const shuffle = (generator, list) => {
    for (let i = 0; i < list.length; i++) {
        const idx = randomBetween(generator, i, list.length)
        swap(list, i, idx)
    }
}

const swap = (list, i, j) => {
    const aux = list[i]
    list[i] = list[j]
    list[j] = aux
}

const retry = async (n, f) => {
    lastException = {}
    for (let i = 0; i < n; i++) {
        try {
            await f()
            return
        } catch (e) {
            lastException = e
            await sleep(50)
        }
    }
    throw lastException
}

async function main(config) {
    const generator = seedrandom(config.seed)

    const kinds = randomBetween(generator, ...config.workloadKinds)
    const totalWorkloads = randomBetween(generator, ...config.totalWorkloads)

    const kindSpec = []


    console.time('promises setup')
    for (let i = 0; i < kinds; i++) {

        const metadataLabelsAmount = randomBetween(generator, ...config.workloadMetadataLabels)
        kindSpec.push({
            results: randomBetween(generator, ...config.resultsPerWorkload),
            name: generateString(generator, 32),
            metadataLabels: take(generator, Object.keys(config.workloadMetadata), metadataLabelsAmount)
        })
    }

    const promises = []
    let counter = 0
    for (let i = 0; i < totalWorkloads; i++) {
        const kindIdx = randomBetween(generator, 0, kinds)
        const spec = kindSpec[kindIdx]

        const metadata = {}
        for (let k = 0; k < spec.metadataLabels.length; k++) {
            const label  = spec.metadataLabels[k]
            metadata[label] = pick(generator, config.workloadMetadata[label])
        }

        const results = []
        for (let j = 0; j < spec.results; j++) {
            const duration = randomBetween(generator, ...config.resultDuration)
            const status = generator() > config.resultFailChance ? 'pass' : 'fail'

            results.push({
                kind: `${spec.name}-${j}`,
                duration,
                status
            })
        }

        promises.push(async () => {
            // create workload
            await retry(10, () => (
                axios.post(`${config.api}/create/workload`, [
                    {
                        kind: spec.name,
                        metadata
                    }
                ])
            ))

            // create results
            await retry(20, () => (
                axios.post(`${config.api}/create/result`, results)
            ))

            counter++
            console.log(`finished ${counter}/${totalWorkloads}`)
        })
    }
    console.timeEnd('promises setup')

    console.time('workload generations')
    await Promise.all(promises.map(f => f()))
    console.timeEnd('workload generations')
}

main(config)

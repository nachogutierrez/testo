const fs = require('fs').promises
const moment = require('moment')
const { randomBetween, shuffle, takeOne, randomBetweenF, cleanFloat, defaultGenerator, templatesDir, resultsDir } = require('./util')

const generateResults = (template, generator = defaultGenerator) => {
    const { testCases, metadata, chosenMetadata } = template
    const results = []
    const m = {}
    for (let i = 0; i < testCases.length; i++) {
        const { name, successRate, duration } = testCases[i]
        const isSuccess = generator() < successRate
        const actualDuration = randomBetween(generator, duration[0], duration[1])
        results.push({
            name,
            isSuccess,
            duration: actualDuration
        })
    }
    for (let i = 0; i < chosenMetadata.length; i++) {
        const key = chosenMetadata[i]
        m[key] = takeOne(metadata[key], generator)
    }

    m.name = template.kind

    return {
        metadata: m,
        results,
        kind: template.kind
    }
}


const args = process.argv.slice(2)
if (args.length < 5) {
    console.log(`USAGE: yarn generate templateName amountLeft amountRight from to`)
    console.log(`example: yarn generate template.json 10 20 2020-05-01 2020-05-25`)
    process.exit(1)
}
const templateFileName = args[0]
const amountLeft = parseInt(args[1], 10)
const amountRight = parseInt(args[2], 10)
const from = args[3]
const to = args[4]

const template = require(`${templatesDir()}/${templateFileName}`)

async function main() {
    await fs.mkdir(`${resultsDir()}`, { recursive: true })

    let m1 = moment(from)
    let m2 = moment(to)

    if (m2.diff(m1, 'days') <= 0) {
        throw new Error('difference in days has to be positive')
    }

    const days = []
    let current = m1
    while(m2.diff(current, 'days') >= 0) {
        days.push(current.format('YYYY-MM-DD'))
        current = current.add(1, 'days')
    }

    for (const day of days) {
        await fs.mkdir(`${resultsDir()}/${day}`, { recursive: true })
        const amount = randomBetween(defaultGenerator, amountLeft, amountRight)

        const timestamp = new Date().getTime()
        for (let i = 0; i < amount; i++) {
            const resultsFileName = `results-${timestamp}-${i}-${templateFileName}`

            const results = generateResults(template)

            await fs.writeFile(`${resultsDir()}/${day}/${resultsFileName}`, JSON.stringify(results, null, 4))
            console.log(`${day} -> ${i + 1}/${amount} results generated`)
        }
    }

    console.log('results saved')
}

main()

const fs = require('fs').promises
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

    return {
        metadata: m,
        results
    }
}

const args = process.argv.slice(2)
let templateFileName = 'template.json'
let amount = 1

if (args.length > 0) {
    amount = args[0]
}

if (args.length > 1) {
    templateFileName = args[1]
}

const template = require(`${templatesDir()}/${templateFileName}`)

async function main() {
    const timestamp = new Date().getTime()
    for (let i = 0; i < amount; i++) {
        const resultsFileName = `results-${timestamp}-${i}-${templateFileName}`

        const results = generateResults(template)

        await fs.writeFile(`${resultsDir()}/${resultsFileName}`, JSON.stringify(results, null, 4))
        console.log(`${i + 1}/${amount} results generated`);
    }
    console.log('results saved')
}

main()

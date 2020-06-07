const fs = require('fs')
const { randomBetween, shuffle, takeOne, randomBetweenF, cleanFloat, defaultGenerator, templatesDir } = require('./util')
const { subjects, connectors, qualities, metadata } = require('../data.json')

const generateTemplate = (props = {}) => {
    const { generator = defaultGenerator, kind, metaAmount, amountTestCases, problematicP } = props
    const used = new Set()
    const metaKeys = Object.keys(metadata)
    shuffle(generator, metaKeys)
    const chosenMetadata = metaKeys.slice(0, metaAmount)
    const testCases = []
    for (var i = 0; i < amountTestCases; i++) {
        let name = `${takeOne(subjects, generator)} ${takeOne(connectors, generator)} ${takeOne(qualities, generator)} with ${takeOne(subjects, generator)}`
        while(used.has(name)) {
            name = `${takeOne(subjects, generator)} ${takeOne(connectors, generator)} ${takeOne(qualities, generator)} with ${takeOne(subjects, generator)}`
        }
        used.add(name)
        const durationLeft = randomBetween(generator, 100, 2000)
        const durationRight = Math.floor(1.5 * durationLeft)

        const isProblematic = generator() > problematicP
        let successRate = randomBetweenF(generator, 0.99, 0.999)
        if (isProblematic) {
            successRate = randomBetweenF(generator, 0.6, 0.75)
        }

        testCases.push({
            name,
            successRate: cleanFloat(successRate),
            isProblematic,
            duration: [durationLeft, durationRight]
        })
    }

    return {
        amountTestCases,
        testCases,
        metadata,
        chosenMetadata,
        kind
    }
}

const args = process.argv.slice(2)
if (args.length < 5) {
    console.log('USAGE: yarn template templateName kind metaAmount amountTestCases problematicP')
    console.log(`example: yarn template template.json 'My awesome testsuite' 3 15 0.95`)
    process.exit(1)
}
const templateName = args[0]
const kind = args[1]
const metaAmount = parseInt(args[2], 10)
const amountTestCases = parseInt(args[3], 10)
const problematicP = parseFloat(args[4])

const template = generateTemplate({ kind, metaAmount, amountTestCases, problematicP })
fs.writeFile(`${templatesDir()}/${templateName}`, JSON.stringify(template, null, 4), err => {
    if (err) throw err
    console.log('template saved')
})

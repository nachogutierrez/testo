const fs = require('fs')
const { randomBetween, shuffle, takeOne, randomBetweenF, cleanFloat, defaultGenerator, templatesDir } = require('./util')
const { subjects, connectors, qualities, metadata } = require('../data.json')

const generateTemplate = (props = {}) => {
    const { generator = defaultGenerator } = props
    const used = new Set()
    const metaKeys = Object.keys(metadata)
    const metaAmount = randomBetween(generator, 1, 4)
    shuffle(generator, metaKeys)
    const chosenMetadata = metaKeys.slice(0, metaAmount)
    const testCases = []
    const amountTestCases = randomBetween(generator, 5, 21)
    for (var i = 0; i < amountTestCases; i++) {
        let name = `${takeOne(subjects, generator)} ${takeOne(connectors, generator)} ${takeOne(qualities, generator)}`
        while(used.has(name)) {
            name = `${takeOne(subjects, generator)} ${takeOne(connectors, generator)} ${takeOne(qualities, generator)}`
        }
        used.add(name)
        const durationLeft = randomBetween(generator, 100, 2000)
        const durationRight = Math.floor(1.5 * durationLeft)

        const isProblematic = generator() > 0.95
        let successRate = randomBetweenF(generator, 0.95, 0.99)
        if (isProblematic) {
            successRate = randomBetweenF(generator, 0.65, 0.75)
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
        chosenMetadata
    }
}

const args = process.argv.slice(2)
let fileName = 'template.json'
if (args.length > 0) {
    fileName = args[0]
}

const template = generateTemplate()
fs.writeFile(`${templatesDir()}/${fileName}`, JSON.stringify(template, null, 4), err => {
    if (err) throw err
    console.log('template saved')
})

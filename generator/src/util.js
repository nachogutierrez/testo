const seedrandom = require('seedrandom')
const crypto = require('crypto')

const cleanFloat = x => parseFloat(x.toFixed(4))

const randomBetween = (generator, leftInclusive, rightExclusive) => {
    return Math.floor(generator() * (rightExclusive - leftInclusive) + leftInclusive)
}

const randomBetweenF = (generator, leftInclusive, rightExclusive) => {
    return generator() * (rightExclusive - leftInclusive) + leftInclusive
}

const takeOne = (list, generator = defaultGenerator) => {
    return list[randomBetween(generator, 0, list.length)]
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

const defaultGenerator = () => Math.random()

const templatesDir = () => `${__dirname}/../templates`
const resultsDir = () => `${__dirname}/../results`

const hash = (s, algo='md5') => crypto.createHash(algo).update(s).digest("hex")

module.exports = {
    randomBetween,
    shuffle,
    takeOne,
    randomBetweenF,
    cleanFloat,
    defaultGenerator,
    templatesDir,
    resultsDir,
    hash
}

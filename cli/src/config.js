const fs = require('fs').promises

const readConfig = async (fileName) => {
    const configJson = await fs.readFile(`./${fileName}`, { encoding: 'utf8' })
    return JSON.parse(configJson)
}

module.exports = {
    readConfig
}

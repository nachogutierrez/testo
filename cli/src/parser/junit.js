const fs = require('fs').promises
const xml2js = require('xml2js')

function isParseable(fileName) {
    return fileName.endsWith('.xml')
}

async function parse(path) {
    const contents = await fs.readFile(path, { encoding: 'utf8' })
    const parsed = await xml2js.parseStringPromise(contents)

    return parsed.testsuite.testcase.map(tc => {

        let status = 'pass'
        if (tc.failure) {
            status = 'fail'
        }
        if (tc.skipped) {
            status = 'skip'
        }

        const duration = Math.floor(parseFloat(tc.$.time) * 1000)
        const ans = {
            status,
            duration,
            kind: `${tc.$.classname}.${tc.$.name}`,
            metadata: {
                class: tc.$.classname,
                method: tc.$.name
            },
            stacktraces: []
        }

        if (tc.failure) {
            ans.stacktraces.push({
                name: 'Stacktrace',
                value: tc.failure[0]._
            })
        }

        return ans
    })
}

module.exports = {
    isParseable,
    parse
}

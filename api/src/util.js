const { createHash } = require('crypto')

function hash_md5(s) {
    return createHash('md5').update(s).digest("hex")
}

const query = async (pool, statement, values=[]) => new Promise((resolve, reject) => {
    pool.query(statement, values, (err, res) => {
        if (err) {
            return reject(err)
        }

        resolve(res)
    })
})

module.exports = {
    hash_md5,
    query
}

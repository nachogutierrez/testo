const { createHash } = require('crypto')

function hash_md5(s) {
    return createHash('md5').update(s).digest("hex")
}

module.exports = {
    hash_md5
}

const tmp = require('tmp')


const createTempFile = () => new Promise((resolve, reject) => {
    tmp.file(function (err, path, fd, cleanupCallback) {
      if (err) {
          return reject(err)
      }

      resolve([path, cleanupCallback, fd])
    })
})

module.exports = {
    createTempFile
}

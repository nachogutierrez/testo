const fs = require('fs').promises
const { admin } = require('../firebase')

const bucket = admin.storage().bucket()

async function uploadWorkloadFiles(args) {
    await uploadRecursive(args.files, `testo/workloads/${args.id}/files`)
}

async function uploadResultFiles(args) {
    await uploadRecursive(args.files, `testo/results/${args.id}/files`)
}

async function uploadRecursive(from, to) {
    const fileNames = await fs.readdir(from)

    for (fileName of fileNames) {
        const stat = await fs.lstat(`${from}/${fileName}`)
        if (!stat.isFile()) {
            uploadRecursive(`${from}/${fileName}`, `${to}/${fileName}`)
        } else {
            console.log(`uploading from ${from}/${fileName} to ${to}/${fileName}`);
            await bucket.upload(`${from}/${fileName}`, {
                destination: `${to}/${fileName}`,
                gzip: true
            })
        }
    }
}

module.exports = {
    uploadWorkloadFiles,
    uploadResultFiles
}

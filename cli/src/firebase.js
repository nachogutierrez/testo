const admin = require("firebase-admin")

const key64 = process.env.FIREBASE_PRIVATE_KEY
const serviceAccount = JSON.parse(Buffer.from(key64, 'base64').toString('utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://testo-d639c.appspot.com"
})

module.exports = {
    admin
}

const admin = require("firebase-admin")

const serviceAccount = process.env.FIREBASE_PRIVATE_KEY

console.log(require(`${__dirname}\\..\\..\\test-service-account-key.json`));

// console.log(`${__dirname}/../../test-service-account-key.json`);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://testo-d639c.firebaseio.com"
// })

module.exports = {
    admin
}

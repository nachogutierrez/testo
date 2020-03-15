const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.TESTO_DB_URI || 'postgres://postgres:postgres@localhost:5432/testo')

module.exports = {
    sequelize
}

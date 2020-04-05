const { Sequelize, DataTypes, Model } = require('sequelize')
const { sequelize } = require('./connection')

class Workload extends Model {}
Workload.init({
    skip: { type: DataTypes.INTEGER, allowNull: false },
    pass: { type: DataTypes.INTEGER, allowNull: false },
    total: { type: DataTypes.INTEGER, allowNull: false },
    duration: { type: DataTypes.INTEGER, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false }
}, {
    sequelize: sequelize
})

class WorkloadMetadata extends Model {}
WorkloadMetadata.init({
    workloadId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    value: { type: DataTypes.STRING, allowNull: false }
}, {
    sequelize: sequelize
})

class Result extends Model {}
Result.init({
    workloadId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('fail', 'skip', 'pass') },
    duration: { type: DataTypes.INTEGER, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false }
}, {
    sequelize: sequelize
})

class ResultMetadata extends Model {}
ResultMetadata.init({
    resultId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    value: { type: DataTypes.STRING, allowNull: false }
}, {
    sequelize: sequelize
})

Workload.hasMany(WorkloadMetadata, { foreignKey: 'workloadId' })
Workload.hasMany(Result, { foreignKey: 'workloadId' })
Result.hasMany(ResultMetadata, { foreignKey: 'resultId' })

const DAO = model => ({
    list(where = {}) {
        return model.findAll({ where, raw: true })
    },
    get(id) {
        return model.findByPk(id).then(entity => entity.get({ plain: true }))
    },
    create(data) {
        return model.create(data)
    },
    update(id, data) {
        return model.update(
            data,
            { where: { id } }
        )
    },
    del(id) {
        return model.destroy({ where: { id } })
    }
})

module.exports = {
    Workload,
    WorkloadMetadata,
    Result,
    ResultMetadata,
    DAO
}

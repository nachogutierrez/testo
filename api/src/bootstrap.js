const { Workload, WorkloadMetadata, Result, ResultMetadata } = require('./model')

async function bootstrap() {
    await Workload.sync({ force: true })
    await WorkloadMetadata.sync({ force: true })
    await Result.sync({ force: true })
    await ResultMetadata.sync({ force: true })
}
bootstrap()

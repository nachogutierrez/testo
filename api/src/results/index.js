module.exports = {
    MemoryResultService: require('./memory/memoryResultService').MemoryResultService,
    PostgresResultService: require('./sql/postgresResultService').PostgresResultService,
    ElasticsearchResultService: require('./elastic/elasticsearchResultService').ElasticsearchResultService
}


const SearchService = function({ client }) {

    async function indexWorkloadMetadata(workload = {}) {
        if (!workload.metadata) return

        const dataset = []
        for (const key of Object.keys(workload.metadata)) {
            dataset.push({
                workloadKind: workload.kind,
                type: 'workload',
                key,
                value: workload.metadata[key]
            })
        }
        console.log(dataset)
        const body = dataset.flatMap(doc => [{ index: { _index: 'metadata' } }, doc])
        await client.bulk({ refresh: true, body })
    }

    async function indexResultMetadata(workload = {}, results = []) {
        console.log('indexing result');
        console.log(workload);
        const dataset = []
        for (const result of results) {
            if (!result.metadata) continue
            for (const key of Object.keys(result.metadata)) {
                dataset.push({
                    workloadKind: workload.kind,
                    type: 'result',
                    key,
                    value: result.metadata[key]
                })
            }
        }

        const body = dataset.flatMap(doc => [{ index: { _index: 'metadata' } }, doc])
        await client.bulk({ refresh: true, body })
    }

    async function suggestions(payload = {}) {
        const { query, workloadKind, type = 'workload' } = payload
        if (!query) return []

        console.log(payload)

        const promises = [
            keySuggestions({ type, workloadKind, query }),
            valueSuggestions({ type, workloadKind, query })
        ]
        const resolved = await Promise.all(promises)

        return [...resolved[0], ...resolved[1]]
    }

    async function keySuggestions({ type, workloadKind, query }) {
        const response = await searchMetadata({ type, workloadKind, query, target: 'key' })

        const keys = response.body.hits.hits.map(hit => hit._source.key)
        const unique = []
        for (const key of keys) {
            if (!unique.includes(key)) {
                unique.push(key)
            }
        }

        return unique.map(key => ({
            suggestion: 'key',
            key
        }))
    }

    async function valueSuggestions({ type, workloadKind, query }) {
        const response = await searchMetadata({ type, workloadKind, query, target: 'value' })
        const pairs = response.body.hits.hits.map(hit => ({
            key: hit._source.key,
            value: hit._source.value
        }))

        const set = new Set()
        const unique = []
        for (const pair of pairs) {
            if (!set.has(`${pair.key}-${pair.value}`)) {
                unique.push(pair)
                set.add(`${pair.key}-${pair.value}`)
            }
        }

        return unique.map(pair => ({
            suggestion: 'filter',
            key: pair.key,
            value: pair.value
        }))
    }

    function searchMetadata({ type, workloadKind, query, target }) {
        return client.search({
            index: 'metadata',
            body: {
                query: {
                    bool: {
                        must: [
                            { match: { type } },
                            workloadKind ? { match: { workloadKind } } : undefined,
                            ...fuzzySearch({ target, query })
                        ].filter(x => x)
                    }
                }
            }
        })
    }

    function fuzzySearch({ target, query }) {
        const terms = query.split(' ').map(x => x.trim()).filter(x => x)

        return terms.map(term => {

            return {
                fuzzy: {
                    [target]: {
                        value: term,
                        fuzziness: 'AUTO',
                        transpositions: true
                    }
                }
            }
        })
    }

    return {
        indexWorkloadMetadata,
        indexResultMetadata,
        suggestions
    }
}

module.exports = {
    SearchService
}

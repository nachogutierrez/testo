const Results = (function() {

    let bindings
    let state
    let config
    let testo

    async function start() {
        state = createBaseState()
        bindings = bind()

        config = await (await fetch('config.json')).json()
        testo = Testo({ api: config.testoApi })

        initState(state, bindings)
        await fetchResults()
        if (state.filters.workloadId) {
            await fetchWorkloadDetail()
        }
        syncState({}, true)
    }

    const createBaseState = () => ({
        page: 1,
        results: [],
        columns: [],
        filters: {
            workloadId: UrlParameters.get('workload'),
            metadata: {}
        }
    })

    const bind = () => ({
        workloadDetail: document.getElementById('workload-detail'),
        resultsTable: document.getElementById('results-table')
    })

    async function fetchResults() {
        state.results = await testo.queryResults(state.filters)
    }

    async function fetchWorkloadDetail() {
        const workloads = await testo.queryWorkloads({ id: state.filters.workloadId })
        state.workloadDetail = workloads[0]
    }

    function initState() {
        bindings.resultsTable.innerHTML = Components.ResultsTable({
            results: state.results,
            columns: state.columns,
            onDeleteColumnClicker: name => `Results.onDeleteColumn('${name}')`,
            onNewColumnPress: "Results.onNewColumnPress(event)"
        })
    }

    function syncState(opts = {}, all=false) {
        const { detail=false||all, filters=false||all, head=false||all, body=false||all } = opts

        if (detail) {
            if(state.filters.workloadId) {
                bindings.workloadDetail.innerHTML = Components.WorkloadDetail({ workload: state.workloadDetail })
            } else {
                bindings.workloadDetail.innerHTML = ''
            }
        }

        if (filters) {
            bindings.resultsTable.querySelector('.filters').innerHTML = Components.ResultFilters({
                filters: state.filters,
                onKindClick: `Results.onKindFilterClick(event)`,
                onMetadataClick: `Results.onMetadataFilterClick(event)`,
                onWorkloadIdFilterClick: 'Results.onWorkloadIdFilterClick(event)'
            })
        }

        if (head) {
            bindings.resultsTable.querySelector('thead').innerHTML = Components.ResultsTableHead({
                columns: state.columns,
                onDeleteColumnClicker: name => `Results.onDeleteColumn('${name}')`
            })
        }
        if (body) {
            bindings.resultsTable.querySelector('tbody').innerHTML = Components.ResultsTableBody({
                columns: state.columns,
                results: state.results,
                onMetadataClick: 'Results.onMetadataClick(event)',
                onKindClick: 'Results.onKindClick(event)',
                onWorkloadIdClick: 'Results.onWorkloadIdClick(event)'
            })

            Drag.init({
              onDropspotHoverIn: (dropspot, shadow) => {
                dropspot.classList.add('colorful')
              },
              onDropspotHoverOut: (dropspot, shadow) => {
                dropspot.classList.remove('colorful')
              },
              onDropspotUsed: (dropspot, target) => {
                  const key = target.getAttribute('data-key')
                  if (!state.columns.includes(key)) {
                      state.columns.push(key)
                      syncState({ head: true, body: true })
                  }
              }
            })
        }
    }

    function onDeleteColumn(name) {
        state.columns = state.columns.filter(c => c !== name)
        syncState({ head: true, body: true })
    }

    function onNewColumnPress(e) {
        if (e.keyCode === 13) {
            const value = e.target.value
            if (value) {
                e.target.value = ''
                state.columns.push(value)
                syncState({ head: true, body: true })
            }
        }
    }

    async function onMetadataClick(e) {
        const key = e.target.getAttribute('data-key')
        const value = e.target.getAttribute('data-value')
        state.filters.metadata[key] = value
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onMetadataFilterClick(e) {
        const key = e.target.getAttribute('data-key')
        delete state.filters.metadata[key]
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onKindClick(e) {
        state.filters.kind = e.target.innerHTML
        state.filters.workloadId = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onKindFilterClick(e) {
        state.filters.kind = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onWorkloadIdClick(e) {
        state.filters.workloadId = e.target.innerHTML
        state.filters.kind = undefined
        await fetchResults()
        await fetchWorkloadDetail()
        syncState({ filters: true, body: true })
    }

    async function onWorkloadIdFilterClick(e) {
        state.filters.workloadId = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    return {
        start,
        onDeleteColumn,
        onNewColumnPress,
        onMetadataClick,
        onMetadataFilterClick,
        onKindClick,
        onKindFilterClick,
        onWorkloadIdClick,
        onWorkloadIdFilterClick
    }
})()

window.addEventListener('load', Results.start)

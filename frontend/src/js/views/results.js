const Results = (function() {

    let bindings
    let state
    let config
    let testo

    async function start() {
        state = createBaseState()
        readStateFromUrl()
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
        filters: { metadata: {} }
    })

    function readStateFromUrl() {
        const bookmarks = Bookmarks.readState()
        state.filters.workloadId = bookmarks.workloadId
        bookmarks.workloadId = undefined

        state.filters.kind = bookmarks.kind
        bookmarks.kind = undefined

        state.columns = []
        if (bookmarks.columns) {
            state.columns = bookmarks.columns.split(',')
            bookmarks.columns = undefined
        }

        if (bookmarks.page) {
            state.page = parseInt(bookmarks.page, 10)
            bookmarks.page = undefined
        }

        state.filters.metadata = {}
        Object.keys(bookmarks).forEach(key => {
            if (bookmarks[key]) {
                state.filters.metadata[key] = bookmarks[key]
            }
        })
    }

    function writeStateToUrl() {
        const bookmarks = {...state.filters.metadata}
        if (state.columns.length > 0) {
            bookmarks.columns = state.columns.join(',')
        }
        if (state.filters.kind) {
            bookmarks.kind = state.filters.kind
        }
        if (state.filters.workloadId) {
            bookmarks.workloadId = state.filters.workloadId
        }
        if (state.page > 1) {
            bookmarks.page = state.page
        }

        Bookmarks.writeState(bookmarks)
    }

    const bind = () => ({
        workloadDetail: document.getElementById('workload-detail'),
        resultsTable: document.getElementById('results-table')
    })

    async function fetchResults() {
        const filters = {}
        filters.page = state.page
        if (state.filters.workloadId) {
            filters.workloadId = state.filters.workloadId
        }
        if (state.filters.kind) {
            filters.kind = state.filters.kind
        }
        if (Object.keys(state.filters.metadata).length > 0) {
            filters.metadata = { ...state.filters.metadata }
        }
        state.results = await testo.queryResults(filters)
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
            onNewColumnPress: "Results.onNewColumnPress(event)",
            onPreviousPageClick: "Results.onPreviousPageClick(event)",
            onNextPageClick: "Results.onNextPageClick(event)"
        })
    }

    function syncState(opts = {}, all=false) {
        writeStateToUrl()

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

            bindings.resultsTable.querySelector('.page-indicator').innerHTML = state.page

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
        state.page = 1
        const key = e.target.getAttribute('data-key')
        const value = e.target.getAttribute('data-value')
        state.filters.metadata[key] = value
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onMetadataFilterClick(e) {
        state.page = 1
        const key = e.target.getAttribute('data-key')
        delete state.filters.metadata[key]
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onKindClick(e) {
        state.page = 1
        state.filters.kind = e.target.innerHTML
        state.filters.workloadId = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onKindFilterClick(e) {
        state.page = 1
        state.filters.kind = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onWorkloadIdClick(e) {
        state.page = 1
        state.filters.workloadId = e.target.innerHTML
        state.filters.kind = undefined
        await fetchResults()
        await fetchWorkloadDetail()
        syncState({ filters: true, body: true })
    }

    async function onWorkloadIdFilterClick(e) {
        state.page = 1
        state.filters.workloadId = undefined
        await fetchResults()
        syncState({ filters: true, body: true })
    }

    async function onNextPageClick(e) {
        state.page++
        await fetchResults()
        if (state.results.length === 0) {
            state.page--
            await fetchResults()
        } else {
            syncState({ body: true })
        }
    }

    async function onPreviousPageClick(e) {
        if (state.page > 1) {
            state.page--
            await fetchResults()
            syncState({ body: true })
        }
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
        onWorkloadIdFilterClick,
        onNextPageClick,
        onPreviousPageClick
    }
})()

window.addEventListener('load', Results.start)

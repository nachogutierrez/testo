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
        if (state.workloadId) {
            await fetchWorkloadDetail()
        }
        syncState(state, bindings)
    }

    const createBaseState = () => ({
        page: 1,
        results: [],
        columns: [],
        workloadId: new URL(window.location.href).searchParams.get('workload')
    })

    const bind = () => ({
        workloadDetail: document.getElementById('workload-detail'),
        resultsTable: document.getElementById('results-table')
    })

    async function fetchResults() {
        state.results = await testo.queryResults({ workloadId: state.workloadId })
    }

    async function fetchWorkloadDetail() {
        const workloads = await testo.queryWorkloads({ id: state.workloadId })
        state.workloadDetail = workloads[0]
    }

    function initState(state, bindings) {
        bindings.resultsTable.innerHTML = Components.ResultsTable({
            results: state.results,
            columns: state.columns,
            onDeleteColumnClicker: name => `Results.onDeleteColumn('${name}')`,
            onNewColumnPress: "Results.onNewColumnPress(event)"
        })
    }

    function syncState(state, bindings) {
        if(state.workloadId) {
            bindings.workloadDetail.innerHTML = Components.WorkloadDetail({ workload: state.workloadDetail })
        } else {
            bindings.workloadDetail.innerHTML = ''
        }
        bindings.resultsTable.querySelector('thead').innerHTML = Components.ResultsTableHead({
            columns: state.columns,
            onDeleteColumnClicker: name => `Results.onDeleteColumn('${name}')`
        })
        bindings.resultsTable.querySelector('tbody').innerHTML = Components.ResultsTableBody({
            columns: state.columns,
            results: state.results
        })
    }

    function onDeleteColumn(name) {
        state.columns = state.columns.filter(c => c !== name)
        syncState(state, bindings)
    }

    function onNewColumnPress(e) {
        if (e.keyCode === 13) {
            const value = e.target.value
            if (value) {
                e.target.value = ''
                state.columns.push(value)
                syncState(state, bindings)
            }
        }
    }

    return {
        start,
        onDeleteColumn,
        onNewColumnPress
    }
})()

window.addEventListener('load', Results.start)

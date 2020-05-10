const Workloads = (function() {

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
        await fetchWorkloads()
        syncState(state, bindings)
    }

    const createBaseState = () => ({
        page: 1,
        workloads: [],
        columns: []
    })

    const bind = () => ({
        workloadsTable: document.getElementById('workloads-table')
    })

    async function fetchWorkloads() {
        state.workloads = await testo.queryWorkloads()
    }

    function initState(state, bindings) {
        bindings.workloadsTable.innerHTML = Components.WorkloadsTable({
            workloads: state.workloads,
            columns: state.columns,
            onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
            onNewColumnPress: "Workloads.onNewColumnPress(event)"
        })
    }

    function syncState(state, bindings) {
        bindings.workloadsTable.querySelector('thead').innerHTML = Components.WorkloadsTableHead({
            columns: state.columns,
            onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`
        })
        bindings.workloadsTable.querySelector('tbody').innerHTML = Components.WorkloadsTableBody({
            columns: state.columns,
            workloads: state.workloads
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

window.addEventListener('load', Workloads.start)

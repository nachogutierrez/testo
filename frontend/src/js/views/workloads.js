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
        syncState({ filters: true, head: true, body: true })
    }

    const createBaseState = () => ({
        page: 1,
        workloads: [],
        columns: [],
        filters: { metadata: {} }
    })

    const bind = () => ({
        workloadsTable: document.getElementById('workloads-table')
    })

    async function fetchWorkloads() {
        const filters = {}
        if (state.filters.kind) {
            filters.kind = state.filters.kind
        }
        if (Object.keys(state.filters.metadata).length > 0) {
            filters.metadata = { ...state.filters.metadata }
        }
        state.workloads = await testo.queryWorkloads(filters)
    }

    function initState() {
        bindings.workloadsTable.innerHTML = Components.WorkloadsTable({
            workloads: state.workloads,
            columns: state.columns,
            filters: state.filters,
            onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
            onNewColumnPress: "Workloads.onNewColumnPress(event)",
            onCheckboxClick: "Workloads.syncState({ head: true, body: true })",
            hiddenColumns: {}
        })
    }

    function syncState(opts={}) {
        const { filters=false, head=false, body=false } = opts

        const hiddenColumns = {}
        document.querySelectorAll('input.column-hider').forEach(el => {
            if (el.checked) {
                hiddenColumns[el.getAttribute('data-target')] = true
            }
        })

        if (filters) {
            bindings.workloadsTable.querySelector('.filters').innerHTML = Components.WorkloadFilters({
                filters: state.filters,
                onKindClick: `Workloads.onKindFilterClick(event)`,
                onMetadataClick: `Workloads.onMetadataFilterClick(event)`
            })
        }

        if (head) {
            bindings.workloadsTable.querySelector('thead').innerHTML = Components.WorkloadsTableHead({
                columns: state.columns,
                hiddenColumns,
                onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
            })
        }
        if (body) {
            bindings.workloadsTable.querySelector('tbody').innerHTML = Components.WorkloadsTableBody({
                columns: state.columns,
                hiddenColumns,
                workloads: state.workloads,
                onMetadataClick: 'Workloads.onMetadataClick(event)',
                onKindClick: `Workloads.onKindClick(event)`
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
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindClick(e) {
        state.filters.kind = e.target.innerHTML
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindFilterClick(e) {
        state.filters.kind = undefined
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onMetadataFilterClick(e) {
        const key = e.target.getAttribute('data-key')
        delete state.filters.metadata[key]
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    return {
        start,
        onDeleteColumn,
        onNewColumnPress,
        onMetadataClick,
        onKindClick,
        syncState,
        onKindFilterClick,
        onMetadataFilterClick
    }
})()

window.addEventListener('load', Workloads.start)

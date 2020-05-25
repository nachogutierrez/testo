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

    function createBaseState() {

        const bookmarks = Bookmarks.readState()
        let s = {
            page: 1,
            workloads: [],
            c: [],
            f: { metadata: {} },
        }

        if (bookmarks.page) {
            s.page = parseInt(bookmarks.page, 10)
            bookmarks.page = undefined
        }

        if (bookmarks.kind) {
            s.f.kind = bookmarks.kind
            bookmarks.kind = undefined
        }

        if (bookmarks.columns) {
            s.c = bookmarks.columns.split(',')
            bookmarks.columns = undefined
        }

        Object.keys(bookmarks).forEach(key => {
            if (bookmarks[key]) {
                s.f.metadata[key] = bookmarks[key]
            }
        })

        return s
    }

    function writeStateToUrl() {
        const bookmarks = {...state.f.metadata}
        if (state.c.length > 0) {
            bookmarks.columns = state.c.join(',')
        }
        if (state.f.kind) {
            bookmarks.kind = state.f.kind
        }
        if (state.page > 1) {
            bookmarks.page = state.page
        }

        Bookmarks.writeState(bookmarks)
    }

    const bind = () => ({
        workloadsTable: document.getElementById('workloads-table')
    })

    async function fetchWorkloads() {
        const filters = {}
        filters.page = state.page
        if (state.f.kind) {
            filters.kind = state.f.kind
        }
        if (Object.keys(state.f.metadata).length > 0) {
            filters.metadata = { ...state.f.metadata }
        }
        state.workloads = await testo.queryWorkloads(filters)
    }

    function initState() {
        bindings.workloadsTable.innerHTML = Components.WorkloadsTable({
            workloads: state.workloads,
            columns: state.c,
            filters: state.f,
            onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
            onNewColumnPress: "Workloads.onNewColumnPress(event)",
            onCheckboxClick: "Workloads.syncState({ head: true, body: true })",
            onPreviousPageClick: "Workloads.onPreviousPageClick(event)",
            onNextPageClick: "Workloads.onNextPageClick(event)",
            hiddenColumns: {}
        })
    }

    function syncState(opts={}) {
        writeStateToUrl()

        const { filters=false, head=false, body=false } = opts

        const hiddenColumns = {}
        document.querySelectorAll('input.column-hider').forEach(el => {
            if (el.checked) {
                hiddenColumns[el.getAttribute('data-target')] = true
            }
        })

        if (filters) {
            bindings.workloadsTable.querySelector('.filters').innerHTML = Components.WorkloadFilters({
                filters: state.f,
                onKindClick: `Workloads.onKindFilterClick(event)`,
                onMetadataClick: `Workloads.onMetadataFilterClick(event)`
            })
        }

        if (head) {
            bindings.workloadsTable.querySelector('thead').innerHTML = Components.WorkloadsTableHead({
                columns: state.c,
                hiddenColumns,
                onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
            })
        }
        if (body) {
            bindings.workloadsTable.querySelector('tbody').innerHTML = Components.WorkloadsTableBody({
                columns: state.c,
                hiddenColumns,
                workloads: state.workloads,
                onMetadataClick: 'Workloads.onMetadataClick(event)',
                onKindClick: `Workloads.onKindClick(event)`
            })

            bindings.workloadsTable.querySelector('.page-indicator').innerHTML = state.page

            Drag.init({
              onDropspotHoverIn: (dropspot, shadow) => {
                dropspot.classList.add('colorful')
              },
              onDropspotHoverOut: (dropspot, shadow) => {
                dropspot.classList.remove('colorful')
              },
              onDropspotUsed: (dropspot, target) => {
                  const key = target.getAttribute('data-key')
                  if (!state.c.includes(key)) {
                      state.c.push(key)
                      syncState({ head: true, body: true })
                  }
              }
            })
        }
    }

    function onDeleteColumn(name) {
        state.c = state.c.filter(c => c !== name)
        syncState({ head: true, body: true })
    }

    function onNewColumnPress(e) {
        if (e.keyCode === 13) {
            const value = e.target.value
            if (value) {
                e.target.value = ''
                state.c.push(value)
                syncState({ head: true, body: true })
            }
        }
    }

    async function onMetadataClick(e) {
        state.page = 1
        const key = e.target.getAttribute('data-key')
        const value = e.target.getAttribute('data-value')
        state.f.metadata[key] = value
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindClick(e) {
        state.page = 1
        state.f.kind = e.target.getAttribute('data-kind')
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindFilterClick(e) {
        state.page = 1
        state.f.kind = undefined
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onMetadataFilterClick(e) {
        state.page = 1
        const key = e.target.getAttribute('data-key')
        delete state.f.metadata[key]
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onNextPageClick(e) {
        state.page++
        await fetchWorkloads()
        if (state.workloads.length === 0) {
            state.page--
            await fetchWorkloads()
        } else {
            syncState({ body: true })
        }
    }

    async function onPreviousPageClick(e) {
        if (state.page > 1) {
            state.page--
            await fetchWorkloads()
            syncState({ body: true })
        }
    }

    return {
        start,
        onDeleteColumn,
        onNewColumnPress,
        onMetadataClick,
        onKindClick,
        syncState,
        onKindFilterClick,
        onMetadataFilterClick,
        onNextPageClick,
        onPreviousPageClick
    }
})()

window.addEventListener('load', Workloads.start)

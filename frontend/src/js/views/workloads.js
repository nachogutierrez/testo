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

        firstRender()
        initComponents()
        await fetchWorkloads()

        syncState({}, true)
    }

    function createBaseState() {

        const bookmarks = Bookmarks.readState()
        let s = {
            page: 1,
            workloads: [],
            filters: { metadata: {} }
        }

        if (bookmarks.page) {
            s.page = parseInt(bookmarks.page, 10)
            bookmarks.page = undefined
        }

        if (bookmarks.kind) {
            s.filters.kind = bookmarks.kind
            bookmarks.kind = undefined
        }

        Object.keys(bookmarks).forEach(key => {
            if (bookmarks[key]) {
                s.filters.metadata[key] = bookmarks[key]
            }
        })

        return s
    }

    function writeStateToUrl() {
        const bookmarks = {...state.filters.metadata}
        if (state.filters.kind) {
            bookmarks.kind = state.filters.kind
        }
        if (state.page > 1) {
            bookmarks.page = state.page
        }

        Bookmarks.writeState(bookmarks)
    }

    const bind = () => ({
        app: document.getElementById('app')
    })

    async function fetchWorkloads() {
        const filters = {}
        filters.page = state.page
        if (state.filters.kind) {
            filters.kind = state.filters.kind
        }
        if (Object.keys(state.filters.metadata).length > 0) {
            filters.metadata = { ...state.filters.metadata }
        }
        state.workloads = await testo.queryWorkloads(filters)
    }

    function firstRender() {
        const { TableView, WorkloadsTableHead } = Components
        bindings.app.innerHTML = TableView({
            title: 'Workloads',
            head: WorkloadsTableHead()
        })
    }

    function initComponents() {
        const { Searchbar, ExploreKey, ApplyFilter, ApplyTag, ExploreButton } = Components

        ExploreButton.init(bindings.app, {
            onClick: () => Components.openExploreView({
                kind: state.filters.kind,
                api: testo,
                onFilterChosen(key, value) {
                    state.filters.metadata[key] = value
                    Components.closeModal()
                    syncState({ filters: true, body: true })
                }
            })
        })

        Searchbar.init(bindings.app, {
            onInput: async (input, setResults) => {
                const suggestions = await testo.suggestions({
                    query: input.value,
                    type: 'workload',
                    workloadKind: state.filters.kind
                })
                setResults(suggestions.map(s => {
                    if (s.suggestion === 'key') {
                        return ExploreKey(s.key)
                    } else {
                        return ApplyFilter(s)
                    }
                }))
            },
            onClick: async (el, input) => {
                const type = el.getAttribute('data-type')
                if (type === 'key') {
                    const key =  el.getAttribute('data-key')
                    input.value = ''
                    input.dispatchEvent(new CustomEvent('input', {}))
                    Components.openExploreView({
                        kind: state.filters.kind,
                        api: testo,
                        key,
                        async onFilterChosen(key, value) {
                            state.filters.metadata[key] = value
                            Components.closeModal()
                            await fetchWorkloads()
                            syncState({ filters: true, body: true })
                        }
                    })
                } else if (type === 'filter') {
                    const key = el.getAttribute('data-key')
                    const value = el.getAttribute('data-value')
                    state.filters.metadata[key] = value
                    input.value = ''
                    input.dispatchEvent(new CustomEvent('input', {}))
                    await fetchWorkloads()
                    syncState({ filters: true, body: true })                    
                    input.focus()
                }
            }
        })

        const { TableFooter } = Components
        TableFooter.init(bindings.app, {
            onPreviousPageClick,
            onNextPageClick
        })
    }

    function syncState(opts={}, all=false) {
        writeStateToUrl()

        const { filters=false||all, body=false||all } = opts

        if (filters) {
            bindings.app.querySelector('.filters').innerHTML = Components.WorkloadFilters({
                filters: state.filters,
                onKindClick: `Workloads.onKindFilterClick(event)`,
                onMetadataClick: `Workloads.onMetadataFilterClick(event)`
            })
        }

        if (body) {
            const { WorkloadsRow } = Components
            bindings.app.querySelector('tbody').innerHTML = state.workloads.map(w => WorkloadsRow({
                workload: w,
                onMetadataClick: 'Workloads.onMetadataClick(event)',
                onKindClick: `Workloads.onKindClick(event)`
            })).join('')

            bindings.app.querySelector('.page-indicator').innerHTML = state.page
        }
    }

    async function onMetadataClick(e) {
        state.page = 1
        const key = e.target.getAttribute('data-key')
        const value = e.target.getAttribute('data-value')
        state.filters.metadata[key] = value
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindClick(e) {
        state.page = 1
        state.filters.kind = e.target.getAttribute('data-kind')
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onKindFilterClick(e) {
        state.page = 1
        state.filters.kind = undefined
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onMetadataFilterClick(e) {
        state.page = 1
        const key = e.target.getAttribute('data-key')
        delete state.filters.metadata[key]
        await fetchWorkloads()
        syncState({ filters: true, body: true })
    }

    async function onPreviousPageClick(e) {
        if (state.page > 1) {
            state.page--
            await fetchWorkloads()
            syncState({ body: true })
        }
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

    return {
        start,
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

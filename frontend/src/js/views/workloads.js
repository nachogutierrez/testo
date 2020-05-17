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
        syncState()
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
            onNewColumnPress: "Workloads.onNewColumnPress(event)",
            onCheckboxClick: "Workloads.syncState()",
            hiddenColumns: {}
        })
    }

    function syncState() {
        console.log('qweqwe');
        const hiddenColumns = {}
        const asd = document.querySelectorAll('input.column-hider').forEach(el => {
            if (el.checked) {
                hiddenColumns[el.getAttribute('data-target')] = true
            }
        })

        bindings.workloadsTable.querySelector('thead').innerHTML = Components.WorkloadsTableHead({
            columns: state.columns,
            hiddenColumns,
            onDeleteColumnClicker: name => `Workloads.onDeleteColumn('${name}')`,
        })
        bindings.workloadsTable.querySelector('tbody').innerHTML = Components.WorkloadsTableBody({
            columns: state.columns,
            hiddenColumns,
            workloads: state.workloads,
            onMetadataClick: 'Workloads.onMetadataClick(event)'
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
                  syncState()
              }
          }
        })
    }

    function onDeleteColumn(name) {
        state.columns = state.columns.filter(c => c !== name)
        syncState()
    }

    function onNewColumnPress(e) {
        if (e.keyCode === 13) {
            const value = e.target.value
            if (value) {
                e.target.value = ''
                state.columns.push(value)
                syncState()
            }
        }
    }

    function onMetadataClick(e) {
      console.log(e.target);
    }

    return {
        start,
        onDeleteColumn,
        onNewColumnPress,
        onMetadataClick,
        syncState
    }
})()

window.addEventListener('load', Workloads.start)

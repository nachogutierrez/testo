
const Workloads = (function() {

    let bindings
    let state
    let config

    async function start() {
        state = initState()
        bindings = bind()
        setListeners(bindings)

        config = await (await fetch('config.json')).json()
        await fetchWorkloads()
    }

    const initState = () => ({
        page: 1,
        workloads: [],
        columns: []
    })

    const bind = () => ({
        newColumnInput: document.getElementById('new-column-input'),
        tableHead: document.querySelector('#workloads-table thead'),
        tableBody: document.querySelector('#workloads-table tbody')
    })

    function setListeners() {
        // add new columns
        bindings.newColumnInput.addEventListener('keyup', e => {
            if (e.keyCode === 13) {
                const value = bindings.newColumnInput.value
                if (value) {
                    bindings.newColumnInput.value = ''
                    state.columns.push(value)
                    syncState(state, bindings)
                }
            }
        })
    }

    async function fetchWorkloads() {
        const payload = {
            limit: 12
        }
        const response = await fetch(`${config.testoApi}/query/workload`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const workloads = await response.json()
        state.workloads = workloads
        syncState(state, bindings)
    }

    function syncState(state, bindings) {
        bindings.tableHead.innerHTML = Render.tableHead({ columns: state.columns })
        bindings.tableBody.innerHTML = Render.tableBody({ workloads: state.workloads, columns: state.columns })
    }

    function onDeleteColumn(name) {
        state.columns = state.columns.filter(c => c !== name)
        syncState(state, bindings)
    }

    return {
        start,
        onDeleteColumn
    }
})()

const Render = (function() {

    const tableHead = props => (`
        <tr>
            <td>id</td>
            <td>kind</td>
            <td>metadata</td>
            ${props.columns.map(name => newColumn({ name })).join('')}
        </tr>
    `)

    const newColumn = props => (`
        <td>
            <div class="flex flex-align-center flex-space-between">
                <div style='margin-right: 4px;'>${props.name}</div>
                <div class="delete-btn" onclick=Workloads.onDeleteColumn('${props.name}')></div>
            </div>
        </td>
    `)
    const td = name => `<td>${name}</td>`

    const tableBody = props => props.workloads.map(w => workload({ workload: w, columns: props.columns })).join('')

    const workload = props => (`
        <tr class="pass">
            <td>${props.workload.id}</td>
            <td>${props.workload.kind}</td>
            <td>
              <div class="flex flex-wrap">
                ${Object.keys(props.workload.metadata).map(key => tag({ key, value: props.workload.metadata[key] })).join('')}
              </div>
            </td>
            ${props.columns.map(key => td(props.workload.metadata[key] || '')).join('')}
        </tr>
    `)

    const tag = props => (`<span class='tag'><strong>${props.key}</strong>=${props.value}</span>`)

    return {
        tableHead,
        tableBody
    }
})()

window.addEventListener('load', Workloads.start)

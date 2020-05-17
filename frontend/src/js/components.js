const Components = (function() {

    const WorkloadsTable = props => (`
        <div class="flex">
          <table>
            <thead class="brown">
                ${WorkloadsTableHead(props)}
            </thead>
            <tbody>
            </tbody>
          </table>

          <div>

            <div class="card dropspot">
              <p>Drag metadata to create new columns</p></div>
            </div>
        </div>
    `)

    const WorkloadsTableHead = props => (`
        <tr>
            <td>id</td>
            <td>summary</td>
            <td>kind</td>
            <td>metadata</td>
            ${props.columns.map(name => NewColumn({ name, onDeleteColumnClicker: props.onDeleteColumnClicker })).join('')}
        </tr>
    `)

    const NewColumn = props => (`
        <td>
            <div class="flex flex-align-center flex-space-between">
                <div style='margin-right: 4px;'>${props.name}</div>
                <div class="delete-btn" onclick=${props.onDeleteColumnClicker(props.name)}></div>
            </div>
        </td>
    `)

    const WorkloadsTableBody = props => props.workloads.map(workload => WorkloadsTableBodyRow({ workload, columns: props.columns, onMetadataClick: props.onMetadataClick })).join('')

    const WorkloadsTableBodyRow = props => (`
        <tr class="${props.workload.fail > 0 ? "fail" : "pass"}">
            <td><a href="results?workload=${props.workload.id}">${props.workload.id}</a></td>
            <td>${Summary(props.workload)}</td>
            <td>${props.workload.kind}</td>
            <td>${MetadataList({ metadata: props.workload.metadata, onClick: props.onMetadataClick })}</td>
            ${props.columns.map(key => Td(props.workload.metadata[key] || '')).join('')}
        </tr>
    `)

    const Td = value => `<td>${value}</td>`

    const Summary = props => (`
        <div class='oneline'>
            <span>Passed: ${props.pass}</span><br>
            <span>Failed: ${props.fail}</span><br>
            <span>Total: ${props.pass + props.fail}</span>
        </div>
    `)

    const MetadataList = props => (`
        <div class="flex flex-wrap">
          ${Object.keys(props.metadata).map(key => Metadata({ key, value: props.metadata[key], onClick: props.onClick })).join('')}
        </div>
    `)
    const Metadata = props => (`<span class='tag noselect draggable clickable' onclick=${props.onClick}><strong class='noclick'>${props.key}</strong>=${props.value}</span>`)

    const ResultsTable = props => (`
        <div class="flex">
          <table>
            <thead class="brown">
                ${ResultsTableHead(props)}
            </thead>
            <tbody>
            </tbody>
          </table>

          <div>
            <input type="text" placeholder="Column name" onkeypress=${props.onNewColumnPress}>
          </div>
        </div>
    `)

    const ResultsTableHead = props => (`
        <tr>
            <td>id</td>
            <td>kind</td>
            <td>status</td>
            <td>duration</td>
            <td>metadata</td>
            ${props.columns.map(name => NewColumn({ name, onDeleteColumnClicker: props.onDeleteColumnClicker })).join('')}
        </tr>
    `)

    const ResultsTableBody = props => props.results.map(result => ResultsTableBodyRow({ result, columns: props.columns })).join('')

    const ResultsTableBodyRow = props => (`
        <tr class="${props.result.status !== 'pass' ? "fail" : "pass"}">
            <td><a href="#">${props.result.id}</a></td>
            <td>${props.result.kind}</td>
            <td>${props.result.status}</td>
            <td>${props.result.duration}</td>
            <td>${MetadataList({ metadata: props.result.metadata })}</td>
            ${props.columns.map(key => Td(props.result.metadata[key] || '')).join('')}
        </tr>
    `)

    const WorkloadDetail = props => (`
        <div class='card flex flex-column'>
            <h3>Workload detail</h3>


            <ul>
                <li>id: ${props.workload.id}</li>
                <li>kind: ${props.workload.kind}</li>
            </ul>

            <div class="card">
                <p>Summary:</p>
                ${Summary({ ...props.workload })}
            </div>

            <div class="card">
                <p>Metadata:</p>
                ${MetadataList({ metadata: props.workload.metadata })}
            </div>
        </div>
    `)

    return {
        WorkloadsTable,
        WorkloadsTableHead,
        WorkloadsTableBody,
        ResultsTable,
        ResultsTableHead,
        ResultsTableBody,
        WorkloadDetail
    }
})()

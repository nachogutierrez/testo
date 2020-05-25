
const Components = (function() {

    function filterObject(obj, f) {
        return Object.keys(obj).filter(key => f(key, obj[key])).reduce((o, key) => ({ [key]: obj[key], ...o }), {})
    }

    const o = f => f() || ''

    const truncate = (s, n) => s.substring(0, n)

    const WorkloadsTable = props => (`
        <div>
            <div class='filters'></div>
            <div>
                <label>Hide kind</label><input class='column-hider' data-target=kind type="checkbox" onclick='${props.onCheckboxClick}' />
            </div>
            <div>
                <label>Hide metadata</label><input class='column-hider' data-target=metadata type="checkbox" onclick='${props.onCheckboxClick}' />
            </div>

            <div class="flex">
              <div class="flex flex-column">
                  <table>
                    <thead class="brown">
                        ${WorkloadsTableHead(props)}
                    </thead>
                    <tbody>
                    </tbody>
                  </table>

                  <div class="flex flex-space-between">
                    <i class="fas fa-chevron-left fa-2x" onclick=${props.onPreviousPageClick}></i>
                    <div class='page-indicator'>1</div>
                    <i class="fas fa-chevron-right fa-2x" onclick=${props.onNextPageClick}></i>
                  </div>
              </div>

              <div>

                <div class="card-dotted dropspot flex flex-align-center">
                  <p class='oneline'><i class="fas fa-plus"></i> Drag metadata</p>
                </div>

              </div>
            </div>
        </div>
    `)

    const WorkloadFilters = props => (`
        <div>
            <h2>Filters</h2>
            ${o(() => {
                if (props.filters && props.filters.kind) {
                    return MetadataList({ metadata: { Kind: props.filters.kind }, onClick: props.onKindClick })
                }
            })}
            ${o(() => {
                if (props.filters && props.filters.metadata && Object.keys(props.filters.metadata).length > 0) {
                    return MetadataList({ metadata: props.filters.metadata, onClick: props.onMetadataClick })
                }
            })}
        </div>
    `)

    const WorkloadsTableHead = props => (`
        <tr>
            <td>id</td>
            <td>summary</td>
            <td>date</td>
            <td ${props.hiddenColumns['kind'] ? "class='hidden'" : ""}>kind</td>
            <td ${props.hiddenColumns['metadata'] ? "class='hidden'" : ""}>metadata</td>
            ${props.columns.sort().map(name => NewColumn({ name, onDeleteColumnClicker: props.onDeleteColumnClicker })).join('')}
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

    const WorkloadsTableBody = props => (
        props.workloads.map(workload => WorkloadsTableBodyRow({
            workload,
            columns: props.columns,
            onMetadataClick: props.onMetadataClick,
            onKindClick: props.onKindClick,
            hiddenColumns: props.hiddenColumns
        })).join('')
    )

    const WorkloadsTableBodyRow = props => (`
        <tr class="${props.workload.fail > 0 ? "fail" : "pass"}">
            <td><a href="results?workloadId=${props.workload.id}">${truncate(props.workload.id, 8)}</a></td>
            <td>${Summary(props.workload)}</td>
            <td>${moment.utc(props.workload.created_at, 'YYYY-MM-DD hh:mm:ss').fromNow()}</td>
            ${o(() => {
                if (!props.hiddenColumns['kind']) {
                    return `<td><a href="javascript:;" onclick=${props.onKindClick} data-kind='${props.workload.kind}'>${truncate(props.workload.kind, 8)}</a></td>`
                }
            })}
            ${o(() => {
                if (!props.hiddenColumns['metadata']) {
                    const ml = MetadataList({
                        metadata: props.workload.metadata,
                        onClick: props.onMetadataClick
                    })
                    return `<td>${ml}</td>`
                }
            })}

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
          ${Object.keys(props.metadata).sort().map(key => Metadata({ key, value: props.metadata[key], onClick: props.onClick })).join('')}
        </div>
    `)
    const Metadata = props => (`
        <span class='tag noselect draggable clickable' onclick=${props.onClick} data-key='${props.key}' data-value='${props.value}'>
            <strong class='noclick'>${props.key}</strong>=${props.value}
        </span>
    `)

    const ResultsTable = props => (`

        <div>
            <div class='filters'></div>

            <div class="flex">
                <div class="flex flex-column">
                    <table>
                        <thead class="brown">
                            ${ResultsTableHead(props)}
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                    <div class="flex flex-space-between">
                        <i class="fas fa-chevron-left fa-2x" onclick=${props.onPreviousPageClick}></i>
                        <div class='page-indicator'>1</div>
                        <i class="fas fa-chevron-right fa-2x" onclick=${props.onNextPageClick}></i>
                    </div>
                </div>

                <div>

                <div class="card-dotted dropspot flex flex-align-center">
                    <p class='oneline'><i class="fas fa-plus"></i> Drag metadata</p>
                </div>

                </div>
            </div>

            <div class='files-container'></div>
        </div>
    `)

    const ResultFilters = props => (`
        <div>
            <h2>Filters</h2>
            ${o(() => {
                if (props.filters && props.filters.workloadId) {
                    return MetadataList({ metadata: { workloadId: props.filters.workloadId }, onClick: props.onWorkloadIdFilterClick })
                }
            })}
            ${o(() => {
                if (props.filters && props.filters.kind) {
                    return MetadataList({ metadata: { Kind: props.filters.kind }, onClick: props.onKindClick })
                }
            })}
            ${o(() => {
                if (props.filters && props.filters.metadata && Object.keys(props.filters.metadata).length > 0) {
                    return MetadataList({ metadata: props.filters.metadata, onClick: props.onMetadataClick })
                }
            })}
        </div>
    `)

    const ResultsTableHead = props => (`
        <tr>
            <td>id</td>
            <td>workloadId</td>
            <td>date</td>
            <td>kind</td>
            <td>status</td>
            <td>duration</td>
            <td>metadata</td>
            ${props.columns.map(name => NewColumn({ name, onDeleteColumnClicker: props.onDeleteColumnClicker })).join('')}
        </tr>
    `)

    const ResultsTableBody = props => props.results.map(result => ResultsTableBodyRow({
        result,
        columns: props.columns,
        onMetadataClick: props.onMetadataClick,
        onKindClick: props.onKindClick,
        onWorkloadIdClick: props.onWorkloadIdClick
    })).join('')

    const ResultsTableBodyRow = props => (`
        <tr class="${props.result.status !== 'pass' ? "fail" : "pass"}">
            <td><a href="javascript:;" data-id='${props.result.id}'>${truncate(props.result.id, 8)}</a></td>
            <td><a href="javascript:;" onclick=${props.onWorkloadIdClick} data-workload-id='${props.result.workload_id}'>${truncate(props.result.workload_id, 8)}</a></td>
            <td>${moment.utc(props.result.created_at, 'YYYY-MM-DD hh:mm:ss').fromNow()}</td>
            ${o(() => {
                if (!props.hiddenColumns || !props.hiddenColumns['kind']) {
                    return `<td><a href="javascript:;" onclick=${props.onKindClick} data-kind='${props.result.kind}'>${truncate(props.result.kind, 8)}</a></td>`
                }
            })}
            <td>${props.result.status}</td>
            <td>${props.result.duration}ms</td>
            <td>${MetadataList({ metadata: props.result.metadata, onClick: props.onMetadataClick })}</td>
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
            <a href="javascript:;" onclick=${props.onFilesClick}>files</a>
        </div>
    `)

    // HoC for Modals
    const Modal = (opts = {}) => C => props => (`
        <div class='modal' onclick=${opts.onCloseModal}>
            <div class='flex flex-justify-center flex-align-center width100 height100'>
                <div class='white' style='${opts.style||''}' onclick='(function(e){ e.stopPropagation() })(event)'>
                    ${C(props)}
                </div>
            </div>
        </div>
    `)

    const Files = props => (`
        <div class='flex flex-column' style='margin: 16px'>
            ${props.files.map(FileEntry).join('')}
        </div>
    `)

    const FileEntry = props => (`
        <a href="${props.url}" target="_blank" style='display: inline-block;'>${props.name}</a>
    `)

    return {
        WorkloadsTable,
        WorkloadsTableHead,
        WorkloadsTableBody,
        ResultsTable,
        ResultsTableHead,
        ResultsTableBody,
        WorkloadDetail,
        WorkloadFilters,
        ResultFilters,
        Modal,
        Files
    }
})()

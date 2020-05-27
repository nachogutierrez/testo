
const Components = (function() {

    function filterObject(obj, f) {
        return Object.keys(obj).filter(key => f(key, obj[key])).reduce((o, key) => ({ [key]: obj[key], ...o }), {})
    }

    const o = f => f() || ''

    const truncate = (s, n) => s.substring(0, n)

    const Logo = () => (`
        <div class='flex'>
            <p class='clickable' style='margin-left: 16px; border: solid 1px black; padding: 4px;'>Testo</p>
        </div>
    `)

    const ExploreButton = props => (`
        <i class="explore-icon fas fa-window-restore clickable" style='margin-left: 16px;'></i>
    `)
    ExploreButton.init = (el, opts = {}) => {
        const buttonEl = el.querySelector('.explore-icon')
    }

    const TableView = props => (`
        <div class='flex flex-column height100'>

            ${Navbar({
                left: Logo(),
                mid: Level({
                    right: ExploreButton(),
                    mid: Searchbar({
                        placeholder: 'Search metadata keys and values...'
                    })
                })
            })}

            <h1>${props.title || 'No Title'}</h1>
            <div class="detail"></div>
            <div class='filters'></div>

            ${Scrollable(Table)(props.head)}
            ${TableFooter()}

            <div class='modal-container'></div>
        </div>
    `)

    const Table = head => (`
        <table class='width100'>
          ${head}
          <tbody>
          </tbody>
        </table>
    `)

    const WorkloadsTableHead = () => (`
        <thead class='primary'>
            <tr>
                <td>id</td>
                <td>summary</td>
                <td>date</td>
                <td>kind</td>
                <td>metadata</td>
            </tr>
        </thead>
    `)

    const ResultsTableHead = () => (`
        <thead class='primary'>
            <tr>
                <td>id</td>
                <td>workloadId</td>
                <td>date</td>
                <td>kind</td>
                <td>status</td>
                <td>duration</td>
                <td>metadata</td>
            </tr>
        </thead>
    `)

    const WorkloadFilters = props => (`
        <div>
            <h2>Filters</h2>
            <div class='flex flex-wrap'>
                ${o(() => {
                    if (props.filters && props.filters.kind) {
                        return FilterList({ metadata: { kind: props.filters.kind }, onClick: props.onKindClick, color: 'kind-color' })
                    }
                })}
                ${o(() => {
                    if (props.filters && props.filters.metadata && Object.keys(props.filters.metadata).length > 0) {
                        return FilterList({ metadata: props.filters.metadata, onClick: props.onMetadataClick })
                    }
                })}
            </div>
        </div>
    `)

    const ResultFilters = props => (`
        <div>
            <h2>Filters</h2>
            <div class='flex flex-wrap'>
                ${o(() => {
                    if (props.filters && props.filters.workloadId) {
                        return FilterList({ metadata: { workloadId: props.filters.workloadId }, onClick: props.onWorkloadIdFilterClick, color: 'id-color' })
                    }
                })}
                ${o(() => {
                    if (props.filters && props.filters.kind) {
                        return FilterList({ metadata: { Kind: props.filters.kind }, onClick: props.onKindClick, color: 'kind-color' })
                    }
                })}
                ${o(() => {
                    if (props.filters && props.filters.metadata && Object.keys(props.filters.metadata).length > 0) {
                        return FilterList({ metadata: props.filters.metadata, onClick: props.onMetadataClick })
                    }
                })}
            </div>
        </div>
    `)

    const WorkloadsRow = props => (`
        <tr class="${props.workload.fail > 0 ? "fail" : "pass"}">
            <td><a href="results?workloadId=${props.workload.id}">${truncate(props.workload.id, 8)}</a></td>
            <td>${Summary(props.workload)}</td>
            <td>${moment.utc(props.workload.created_at, 'YYYY-MM-DD hh:mm:ss').fromNow()}</td>
            <td><a href="javascript:;" onclick=${props.onKindClick} data-kind='${props.workload.kind}'>${truncate(props.workload.kind, 8)}</a></td>
            <td>${
                MetadataList({
                    metadata: props.workload.metadata,
                    onClick: props.onMetadataClick
                })
            }</td>
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
          ${Object.keys(props.metadata).sort().map(key => Filter({ key, value: props.metadata[key], onClick: props.onClick, color: props.color })).join('')}
        </div>
    `)

    const Wrap = x => (`
        <div class='flex wrap'>
            ${x}
        </div>
    `)

    const FilterList = props => (`
        ${Object.keys(props.metadata).sort().map(key => Filter({ key, value: props.metadata[key], onClick: props.onClick, color: props.color })).join('')}
    `)

    const Filter = props => (`
        <span class='tag noselect draggable clickable ${props.color || 'filter-color'}' onclick=${props.onClick} data-key='${props.key}' data-value='${props.value}'>
            <strong class='noclick'>${props.key}</strong>=${props.value}
        </span>
    `)

    const TableFooter = () => (`
        <div class="footer flex flex-space-between flex-align-center">
            <i class="fas fa-chevron-left fa-2x clickable" style='padding: 8px'></i>
            <div class='page-indicator'>1</div>
            <i class="fas fa-chevron-right fa-2x clickable" style='padding: 8px'></i>
        </div>
    `)
    TableFooter.init = (el, opts = {}) => {
        if (opts.onPreviousPageClick) {
            el.querySelector('.footer .fa-chevron-left').addEventListener('click', opts.onPreviousPageClick)
        }
        if (opts.onNextPageClick) {
            el.querySelector('.footer .fa-chevron-right').addEventListener('click', opts.onNextPageClick)
        }
    }

    const ResultsTableBody = props => props.results.map(result => ResultsTableBodyRow({
        result,
        columns: props.columns,
        onMetadataClick: props.onMetadataClick,
        onKindClick: props.onKindClick,
        onWorkloadIdClick: props.onWorkloadIdClick,
        onIdClick: props.onIdClick
    })).join('')

    const ResultsTableBodyRow = props => (`
        <tr class="${props.result.status}">
            ${o(() => {
                if (props.result.status !== 'pass') {
                    return `<td><a href="javascript:;" data-id='${props.result.id}' onclick=${props.onIdClick}>${truncate(props.result.id, 8)}</a></td>`
                } else {
                    return `<td>${truncate(props.result.id, 8)}</td>`
                }
            })}
            <td><a href="javascript:;" onclick=${props.onWorkloadIdClick} data-workload-id='${props.result.workload_id}'>${truncate(props.result.workload_id, 8)}</a></td>
            <td class='oneline'>${moment.utc(props.result.created_at, 'YYYY-MM-DD hh:mm:ss').fromNow()}</td>
            <td><a href="javascript:;" onclick=${props.onKindClick} data-kind='${props.result.kind}'>${truncate(props.result.kind, 8)}</a></td>
            <td>${props.result.status}</td>
            <td>${props.result.duration}ms</td>
            <td>${MetadataList({ metadata: props.result.metadata, onClick: props.onMetadataClick })}</td>
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

    const TabView = (tabs = []) => (`
        <div class='flex flex-column'>
            <div class='tabs flex'>
                ${tabs.map(Tab).join('')}
            </div>

            <div class='tab-contents-container'>
                ${tabs.map(TabContent).join('')}
            </div>
        </div>
    `)

    TabView.init = (el, opts = {}) => {
        const tabs = el.querySelectorAll('.tab')
        const contents = el.querySelectorAll('.tab-contents')
        const hideAll = () => {
            tabs.forEach(tabEl => tabEl.classList.remove('active'))
            contents.forEach(tabEl => tabEl.classList.add('hidden'))
        }
        const select = target => {
            hideAll()
            target.classList.add('active')
            contents.forEach(tabEl => {
                if (target.innerHTML === tabEl.getAttribute('data-name')) {
                    tabEl.classList.remove('hidden')
                }
            })
        }
        tabs.forEach(tabEl => {
            tabEl.addEventListener('click', e => select(e.target))
        })
        select(tabs[0])
    }

    const Tab = props => (`
        <div class='tab button' style='border: solid 1px black; padding: 8px;'>${props.name}</div>
    `)

    const TabContent = props => (`
        <div class='tab-contents' data-name='${props.name}'>
            <pre class='stacktrace scrollable' style='max-height: 512px;'>${props.value}</pre>
        </div>
    `)

    const Scrollable = (C, opts = {}) => props => (`
        <div style='overflow: scroll; position: relative;'>
            ${C(props)}
        </div>
    `)

    const Stacktrace = st => (`
        <pre class='stacktrace'>${st}</pre>
    `)

    const Files = props => (`
        <div class='flex flex-column' style='margin: 16px'>
            ${props.files.map(FileEntry).join('')}
        </div>
    `)

    const FileEntry = props => (`
        <a href="${props.url}" target="_blank" style='display: inline-block;'>${props.name}</a>
    `)

    const Navbar = (props = {}) => (`
        <div class='nav flex flex-space-between flex-align-center primary' style='height: 48px; min-height: 48px;'>
            <div style='flex: 1;'>${props.left || ''}</div>
            <div>${props.mid || ''}</div>
            <div style='flex: 1;'>${props.right || ''}</div>
        </div>
    `)

    const Level = (props = {}) => (`
        <div class='level flex flex-space-between flex-align-center'>
            <div style='flex: 1;'>${props.left || ''}</div>
            <div>${props.mid || ''}</div>
            <div style='flex: 1;'>${props.right || ''}</div>
        </div>
    `)

    const Searchbar = (props = {}) => (`
        <div class='searchbar' style='height: ${props.height || '24px'};'>
          <input type="text" placeholder="${props.placeholder || ''}" style='width: 512px; height: ${props.height || '24px'}; font-size: 16px; border: 0;'>

          <div class='results flex flex-column' style='background: gray; width: 100%; visibility: hidden; position: relative; z-index: 5;'>
            <div class="item" style='padding: 4px; color: violet;'>explore key: <span><strong>branch</strong></span></div>
            <div class="item" style='padding: 4px; color: violet;'>explore key: <span><strong>brown</strong></span></div>
            <div class="item" style='padding: 4px; color: orange;'>apply filter: <span><strong>branch=master</strong></span></div>
            <div class="item" style='padding: 4px; color: lightblue;'>apply tag: <span><strong>TE-6652</strong></span></div>
          </div>
        </div>
    `)
    Searchbar.init = (el, opts = {}) => {
        const resultsEl = el.querySelector('.searchbar .results')
        const inputEl = el.querySelector('.searchbar input')
        const setResults = (r = []) => {
            resultsEl.innerHTML = r.join('')
            resultsEl.childNodes.forEach((cn, i) => {
                cn.addEventListener('click', () => {
                    if (opts.onClick) opts.onClick(cn, i)
                })
            })
        }
        inputEl.addEventListener('input', e => {
            if (!inputEl.value) {
                resultsEl.style.visibility = 'hidden'
            }
            else {
                resultsEl.style.visibility = 'visible'
                if (opts.onInput) opts.onInput(inputEl, setResults)
            }
        })
    }

    const ExploreKey = key => `<div class='clickable' style='padding: 4px; color: violet;'>explore key: <span><strong>${key}</strong></span></div>`
    const ApplyFilter = props => `<div class='clickable' style='padding: 4px; color: orange;'>apply filter: <span><strong>${props.key}=${props.value}</strong></span></div>`
    const ApplyTag = tag => `<div class='clickable' style='padding: 4px; color: lightblue;'>apply tag: <span><strong>${tag}</strong></span></div>`

    return {
        TableView,
        WorkloadsTableHead,
        ResultsTableHead,
        WorkloadsRow,
        ResultsTableBody,
        WorkloadDetail,
        WorkloadFilters,
        ResultFilters,
        Modal,
        Files,
        TabView,
        Scrollable,
        Stacktrace,
        Navbar,
        Searchbar,
        ExploreKey,
        ApplyFilter,
        ApplyTag,
        TableFooter
    }
})()

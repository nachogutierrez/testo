
const Components = (function() {

    function filterObject(obj, f) {
        return Object.keys(obj).filter(key => f(key, obj[key])).reduce((o, key) => ({ [key]: obj[key], ...o }), {})
    }

    const o = f => f() || ''

    const truncate = (s, n) => `${s}`.substring(0, n)

    const openModal = c => {
        const container = document.querySelector('.modal-container')
        container.innerHTML = Modal(c)
        return container
    }

    const closeModal = () => {
        document.querySelector('.modal-container').innerHTML = ''
    }

    function openExploreView(opts = {}) {
        const { ExploreView } = Components
        const container = openModal(ExploreView())
        ExploreView.init(container, opts)
    }

    const Logo = () => (`
        <div class='flex'>
            <a href='/workloads' class='clickable' style='margin-left: 16px; border: solid 1px black; padding: 4px;'>Testo</a>
        </div>
    `)

    const Insights = props => (`
        <div class='cell row' style='height: 256px;'>
            <div class='cell row'>
                <div class='cell column'>
                    <div class='cell row'>${InfographicNumber({ number: props.totalWorkloads, title: 'total workloads', textColor: 'white' })}</div>
                    <div class='cell row'>${InfographicNumber({ number: props.totalResults, title: 'total results', textColor: 'white' })}</div>
                </div>
                <div class='cell column'>
                    <div class='cell row'>${InfographicNumber({ number: props.pass, title: 'workloads passed', color: 'pass' })}</div>
                    <div class='cell row'>${InfographicNumber({ number: props.fail, title: 'workloads failed', color: 'fail' })}</div>
                </div>
                <div class='cell column'>
                    <div class='cell row'>${InfographicNumber({ number: props.count.pass, title: 'results passed', color: 'pass', size: '24px' })}</div>
                    <div class='cell row'>${InfographicNumber({ number: props.count.fail, title: 'results failed', color: 'fail', size: '24px' })}</div>
                    <div class='cell row'>${InfographicNumber({ number: props.count.skip, title: 'results skipped', color: 'skip', size: '24px' })}</div>
                </div>
            </div>


            <div class='cell row'>
                ${InsightsChart()}
            </div>
        </div>
    `)
    Insights.init = (el, opts = {}) => {
        InsightsChart.init(el, opts)
    }

    const InsightsChart = props => (`
        <div class='border-box' style='width: 100%; height: 100%; padding: 8px;'>
            <canvas></canvas>
        </div>
    `)
    InsightsChart.init = (el, opts = {}) => {
        const canvas = el.querySelector('canvas')
        const ctx = canvas.getContext('2d')

        const labels = Object.keys(opts.byDate).sort((a, b) => moment(a, 'YYYY/MM/DD').unix() - moment(b, 'YYYY/MM/DD').unix())
        const datasets = [
            {
                label: 'passed',
                data: [],
                backgroundColor: '#ACFFA5'
            },
            {
                label: 'failed',
                data: [],
                backgroundColor: '#FFB5A5'
            }
        ]
        for (const label of labels) {
            datasets[0].data.push(opts.byDate[label].fail)
            datasets[1].data.push(opts.byDate[label].pass)
        }
        const stackedBar = new Chart(ctx, {
            type: 'bar',

            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                }
            }
        })
    }

    const InfographicNumber = props => (`
        <div class='width100 height100 border-box flex flex-center' style='padding: 8px;'>
            <div class='width100 height100 flex flex-column flex-center ${props.color || 'blue'}' style='border: 1px solid black; border-radius: 2px; color: ${props.textColor || 'black'};'>
                <p style='font-size: ${props.size || '42px'};'>${props.number}</p>
                <p style='font-size: 14px;'>${props.title}</p>
            </div>
        </div>
    `)

    const TableView = props => (`
        <div class='flex flex-column height100'>

            ${Navbar({
                left: Logo(),
                mid: Level({
                    mid: Searchbar({
                        placeholder: 'Search metadata keys and values...'
                    }),
                    right: `<div style='margin-left: 16px;'>${ExploreButton()}</div>`
                })
            })}

            <div class='insights'></div>

            <h1>${props.title || 'No Title'}</h1>
            <div class="detail"></div>
            <div class='filters'></div>

            ${Scrollable(Table(props.head))}
            ${TableFooter()}

            <div class='modal-container'></div>
        </div>
    `)
    TableView.init = (el, opts = {}) => {

    }

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
        <tr class="${props.workload.count.fail > 0 ? "fail" : "pass"}">
            <td class='oneline'><a href="results?workloadId=${props.workload.id}">${truncate(props.workload.id, 8)}</a></td>
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
            <span>Passed: ${props.count.pass}</span><br>
            <span>Failed: ${props.count.fail}</span><br>
            <span>Skipped: ${props.count.skip}</span><br>
            <span>Total: ${props.count.pass + props.count.fail + props.count.skip}</span>
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
            <i class="fas fa-chevron-left fa-2x clickable left" style='padding: 8px'></i>
            <div class='page-indicator'>1</div>
            <i class="fas fa-chevron-right fa-2x clickable right" style='padding: 8px'></i>
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
            <td><a href="javascript:;" onclick=${props.onWorkloadIdClick} data-workload-id='${props.result.workloadId}'>${truncate(props.result.workloadId, 8)}</a></td>
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

    const Modal = (c, opts = { containerSelector: '.modal-container' }) => (`
        <div class='modal' onclick="document.querySelector('${opts.containerSelector}').innerHTML = ''">
            <div class='flex flex-justify-center flex-align-center width100 height100'>
                <div class='white' style='${opts.style||''}' onclick='(function(e){ e.stopPropagation() })(event)'>
                    ${c}
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

    const Scrollable = (c, opts = {}) => (`
        <div style='overflow-y: scroll; position: relative;'>
            ${c}
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
            <p style='padding: 4px;'>No results...</p>
          </div>
        </div>
    `)
    Searchbar.init = (el, opts = {}) => {
        let results = []
        const resultsEl = el.querySelector('.searchbar .results')
        const inputEl = el.querySelector('.searchbar input')
        const empty = () => resultsEl.innerHTML = `<p style='padding: 4px;'>No results...</p>`
        const setResults = (r = []) => {
            results = r
            if (!r || r.length === 0) {
                empty()
                return
            }
            resultsEl.innerHTML = r.join('')
            resultsEl.childNodes.forEach((cn, i) => {
                cn.setAttribute('tabindex', '-1')
                cn.addEventListener('click', () => {
                    if (opts.onClick) opts.onClick(cn, inputEl)
                })
                cn.addEventListener('keydown', e => {
                    if (e.keyCode === 38) {
                        if (i === 0) {
                            inputEl.focus()
                            setTimeout(() => inputEl.selectionStart = inputEl.selectionEnd = 10000, 0)
                        } else {
                            resultsEl.childNodes[i - 1].focus()
                        }
                    } else if (e.keyCode === 40) {
                        const next = resultsEl.childNodes[i + 1]
                        if (next) {
                            next.focus()
                        }
                    } else if (e.keyCode === 13) {
                        cn.click()
                    }
                })
            })
        }
        inputEl.addEventListener('input', e => {
            if (!inputEl.value) {
                resultsEl.style.visibility = 'hidden'
                results = []
                empty()
            }
            else {
                resultsEl.style.visibility = 'visible'
                if (opts.onInput) opts.onInput(inputEl, setResults)
            }
        })
        inputEl.addEventListener('keydown', e => {
            if (e.keyCode === 40) {
                if (results.length > 0) {
                    resultsEl.childNodes[0].focus()
                }
            } else if (e.keyCode === 13) {
                if (results.length > 0) {
                    resultsEl.childNodes[0].click()
                }
            }
        })
    }

    const ExploreButton = props => (`
        <div class='explore-icon clickable' style='padding: 8px; border-radius: 50%;'>
            <i class="fas fa-window-restore"></i>
        </div>
    `)
    ExploreButton.init = (el, opts = {}) => el.querySelector('.explore-icon').addEventListener('click', opts.onClick)

    const ExploreView = props => (`
        <div style='padding: 16px;'>
            <div class='explore-view' style='overflow-y: hidden; position: relative; height: 512px; width: 512px;'>
                <div class='keys height100'></div>
            </div>
        </div>
    `)

    ExploreView.init = async (el, opts = {}) => {
        let { kind, api, onFilterChosen = ()=>'', key, type = 'workload' } = opts
        const viewEl = el.querySelector('.explore-view')
        const keysEl = viewEl.querySelector('.keys')

        function initView() {
            if (key) {
                keysEl.innerHTML = PaginatedView()
                PaginatedView.init(keysEl, {
                    async render(limit, skip) {

                        const values = await api.getMetadataValues({ kind, limit, skip, key, type })
                        if (values.length === 0) return undefined
                        return (`
                            <div class='flex flex-column height100'>
                                <i class="fas fa-chevron-left back clickable" style='padding: 16px; align-self: flex-start'></i>
                                <h2 style='text-align: center; margin: 16px;'>explore values</h2>
                                <h3 style='text-align: center; margin-bottom: 8px;'>key = ${key}</h2>
                                ${ExploreViewTags({ kind })}
                                ${Scrollable(values.map(ExploreViewItem).join(''))}
                            </div>
                        `)
                    },
                    activate(el) {
                        el.querySelectorAll('.item').forEach(item => item.addEventListener('click', e => {
                            const value = e.target.innerHTML
                            onFilterChosen(key, value)
                        }))
                        el.querySelector('.back').addEventListener('click', () => {
                            key = undefined
                            initView()
                        })
                    }
                })
            } else {
                keysEl.innerHTML = PaginatedView()
                PaginatedView.init(keysEl, {
                    async render(limit, skip) {

                        const keys = await api.getMetadataKeys({ kind, limit, skip, type })
                        if (keys.length === 0) return undefined
                        return (`
                            <div class='flex flex-column height100'>
                                <h2 style='text-align: center; margin: 16px;'>explore keys</h2>
                                ${ExploreViewTags({ kind })}
                                ${Scrollable(keys.map(ExploreViewItem).join(''))}
                            </div>
                        `)
                    },
                    activate(el) {
                        el.querySelectorAll('.item').forEach(item => item.addEventListener('click', e => {
                            key = e.target.innerHTML
                            initView()
                        }))
                    }
                })
            }
        }
        initView()
    }

    const ExploreViewTags = props => (`
        <div class='flex flex-wrap' style='margin-bottom: 16px'>
            ${o(() => {
                const list = []
                if (props.kind) {
                    list.push(FilterList({ metadata: { kind: props.kind }, color: 'kind-color' }))
                }
                return list.join('')
            })}
        </div>
    `)

    const ExploreViewItem = value => (`
        <div class='item clickable' style='border: solid 1px black; padding: 4px;'>${value}</div>
    `)

    const PaginatedView = () => (`
        <div class='paginated-view flex flex-column height100'>
            <div class='content height100' style='overflow: hidden;'></div>
            ${TableFooter()}
        </div>
    `)
    PaginatedView.init = async (el, opts = {}) => {
        const viewEl = el.querySelector('.paginated-view')
        const contentEl = viewEl.querySelector('.content')
        const pageIndicatorEl = viewEl.querySelector('.footer .page-indicator')
        const { render, activate } = opts
        let pageSize = 10
        let page = 1

        viewEl.querySelector('.footer .left').addEventListener('click', async () => {
            if (page <= 1) return
            page--
            contentEl.innerHTML = await render(pageSize, (page - 1) * pageSize)
            pageIndicatorEl.innerHTML = page
            activate(contentEl)
        })
        viewEl.querySelector('.footer .right').addEventListener('click', async () => {
            page++
            const newContent = await render(pageSize, (page - 1) * pageSize)
            if (newContent) {
                contentEl.innerHTML = newContent
                pageIndicatorEl.innerHTML = page
                activate(contentEl)
            } else {
                page--
            }
        })
        contentEl.innerHTML = await render(pageSize, (page - 1) * pageSize)
        activate(contentEl)
    }

    const ExploreKey = key => `<div class='clickable' style='padding: 4px; color: violet;' data-type='key' data-key='${key}'>explore key: <span><strong>${key}</strong></span></div>`
    const ApplyFilter = props => `<div class='clickable' style='padding: 4px; color: orange;' data-type='filter' data-key='${props.key}' data-value='${props.value}'>apply filter: <span><strong>${props.key}=${props.value}</strong></span></div>`
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
        TableFooter,
        ExploreButton,
        ExploreView,
        openModal,
        closeModal,
        openExploreView,
        Insights
    }
})()

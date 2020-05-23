const Bookmarks = (function() {

  const STATE_NAME = 's'

  function readState() {
    const params = new URL(window.location.href).searchParams
    const state = {}
    for (let key of params.keys()) {
        state[key] = params.get(key)
    }
    return state
  }

  function writeState(state) {
    const params = new URLSearchParams()

    Object.keys(state).filter(key => state[key] && typeof(state[key]) === 'string').sort().forEach(key => {
        params.set(key, state[key])
    })

    let s = `${window.location.pathname}`
    if (params.toString()) {
        s += `?${params.toString()}`
    }

    window.history.replaceState("", "", s)
  }

  function prune(obj) {
    if (!isObject(obj)) return obj
    Object.keys(obj).forEach(key => {
      obj[key] = prune(obj[key])
      if (isEmpty(obj[key])) {
        delete obj[key]
      }
    })
    return {...obj}
  }

  function isObject(obj) {
    return typeof(obj) === 'object' && !Array.isArray(obj)
  }

  function isEmpty(o) {
    if (!o) return true
    if (typeof(o) !== 'object') return false
    if (Array.isArray(o)) return o.length === 0
    return Object.keys(o).length === 0
  }

  return {
    readState,
    writeState
  }
})()

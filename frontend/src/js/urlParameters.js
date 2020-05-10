const UrlParameters = (function() {

  function get(key) {
    return new URL(window.location.href).searchParams.get(key)
  }

  /*
  * state: object where values are strings, easily mappable to url parameters
  */
  function set(key, value) {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set(key, value)
    window.history.pushState("", "", `${newUrl.pathname}${newUrl.search}`)
  }

  return {
    get,
    set
  }
})()

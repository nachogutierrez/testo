const Bookmarks = (function() {

  const STATE_NAME = 's'

  function readState() {
    const value = new URL(window.location.href).searchParams.get(STATE_NAME)
    if (value) {
      return JSON.parse(lzw_decode(value))
    }
    return {}
  }

  function writeState(state) {
    state = prune({...state})
    const newUrl = new URL(window.location.href)
    if (!isEmpty(state)) {
      newUrl.searchParams.set(STATE_NAME, lzw_encode(JSON.stringify(state)))
    }

    window.history.pushState("", "", `${newUrl.pathname}${newUrl.search}`)
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

    // LZW-compress a string
  function lzw_encode(s) {
      var dict = {};
      var data = (s + "").split("");
      var out = [];
      var currChar;
      var phrase = data[0];
      var code = 256;
      for (var i=1; i<data.length; i++) {
          currChar=data[i];
          if (dict[phrase + currChar] != null) {
              phrase += currChar;
          }
          else {
              out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
              dict[phrase + currChar] = code;
              code++;
              phrase=currChar;
          }
      }
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      for (var i=0; i<out.length; i++) {
          out[i] = String.fromCharCode(out[i]);
      }
      return out.join("");
  }

  // Decompress an LZW-encoded string
  function lzw_decode(s) {
      var dict = {};
      var data = (s + "").split("");
      var currChar = data[0];
      var oldPhrase = currChar;
      var out = [currChar];
      var code = 256;
      var phrase;
      for (var i=1; i<data.length; i++) {
          var currCode = data[i].charCodeAt(0);
          if (currCode < 256) {
              phrase = data[i];
          }
          else {
             phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
          }
          out.push(phrase);
          currChar = phrase.charAt(0);
          dict[code] = oldPhrase + currChar;
          code++;
          oldPhrase = phrase;
      }
      return out.join("");
  }

  return {
    readState,
    writeState
  }
})()

const Drag = (function() {

  let dragTarget
  let dragShadow
  let offset

  let dropSpots

  let hoverInHandler
  let hoverOutHandler
  let usedHandler

  function init(opts = {}) {
    const id = x => x
    const { onDropspotHoverIn=id, onDropspotHoverOut=id, onDropspotUsed=id } = opts
    hoverInHandler = onDropspotHoverIn
    hoverOutHandler = onDropspotHoverOut
    usedHandler = onDropspotUsed

    dropspots = document.querySelectorAll('.dropspot')
    safelySetListener(document.body, 'mousemove', onGlobalMouseMove)
    safelySetListener(document.body, 'mouseup', onMouseUp)
    document.querySelectorAll('.draggable').forEach(target => {
      safelySetListener(target, 'mousedown', onMouseDown)
    })
  }

  function safelySetListener(target, event, handler) {
    target.removeEventListener(event, handler, false)
    target.addEventListener(event, handler)
  }

  function onMouseDown(e) {
    dragTarget = e.target
    offset = { x: e.offsetX, y: e.offsetY }
  }

  function onMouseUp(e) {
    for (let i = 0; i < dropspots.length; i++) {
      if (isContained(dropspots[i], e.clientX, e.clientY)) {
        usedHandler(dropspots[i], dragTarget)
      }
      hoverOutHandler(dropspots[i], dragShadow)
    }
    dragTarget = undefined
    offset = undefined
    destroyShadow()
  }

  function onGlobalMouseMove(e) {
    if (e.buttons & 1 && dragTarget) {
      createShadow()
      const rect = dragShadow.getBoundingClientRect()
      positionShadow(e.clientX - offset.x, e.clientY - offset.y)
      for (let i = 0; i < dropspots.length; i++) {
        if (isContained(dropspots[i], e.clientX, e.clientY)) {
          hoverInHandler(dropspots[i], dragShadow)
        } else {
          hoverOutHandler(dropspots[i], dragShadow)
        }
      }
    } else {
      dragTarget = undefined
      offset = undefined
      destroyShadow()
    }
  }

  function isContained(el, x, y) {
    const rect = el.getBoundingClientRect()
    return rect.x <= x && x <= rect.x + rect.width && rect.y <= y && y <= rect.y + rect.height
  }

  function createShadow() {
    if (!dragShadow) {
      dragShadow = dragTarget.cloneNode(true)
      dragShadow.classList.add('drag-shadow')
      document.body.appendChild(dragShadow)
    }
  }

  function destroyShadow() {
    if (dragShadow) {
      document.body.removeChild(dragShadow)
      dragShadow = undefined
    }
  }

  function positionShadow(x, y) {
    dragShadow.style.left = `${x}px`
    dragShadow.style.top = `${y}px`
  }

  return {
    init
  }
})()

export default class NotifyController {
  constructor() {
    this.options = {
      fadeInDuration: 1000,
      fadeOutDuration: 1000,
      fadeInterval: 50,
      visibleDuration: 5000,
      postHoverVisibleDuration: 500,
      position: 'bottomLeft'
    }
  }

  info = text => {
    return this._addNotify({ notifyClass: 'notify__info', text })
  }

  error = text => {
    return this._addNotify({ notifyClass: 'notify__error', text })
  }

  _addNotify = ({ notifyClass, text }) => {
    if (!text) return null

    const fragment = document.createDocumentFragment()
    const item = document.createElement('div')
    item.classList.add('notify')
    item.classList.add(notifyClass)
    item.style.opacity = 0

    item.options = this.options

    item.appendChild(this._addText(text))

    item.visibleDuration = item.options.visibleDuration

    const hideNotify = () => {
      item.fadeInterval = this._fade('out', item.options.fadeOutDuration, item)
    }
    const resetInterval = () => {
      clearTimeout(item.interval)
      clearTimeout(item.fadeInterval)
      item.style.opacity = null
      item.visibleDuration = item.options.postHoverVisibleDuration
    }

    const hideTimeout = () => {
      item.interval = setTimeout(hideNotify, item.visibleDuration)
    }

    fragment.appendChild(item)
    const container = this._getNotifyContainer(item.options.position)
    container.appendChild(fragment)

    item.addEventListener('mouseover', resetInterval)

    this._fade('in', item.options.fadeInDuration, item)

    item.addEventListener('mouseout', hideTimeout)
    hideTimeout()
    return item
  }

  _addText = text => {
    const item = document.createElement('div')
    item.classList.add('notify__text')
    item.innerHTML = text
    return item
  }

  _getNotifyContainer = () => {
    const container = document.querySelector('.vn-bottom-left')
    return container ? container : this._createNotifyContainer()
  }

  _createNotifyContainer = () => {
    const fragment = document.createDocumentFragment()
    const container = document.createElement('div')
    container.classList.add('notify-container')
    container.classList.add('vn-bottom-left')
    container.setAttribute('role', 'alert')

    fragment.appendChild(container)
    document.body.appendChild(fragment)

    return container
  }

  _remove = item => {
    item.style.display = 'none'
    item.outerHTML = ''
    item = null
  }

  _fade = (type, ms, el) => {
    const isIn = type === 'in'
    let opacity = isIn ? 0 : el.style.opacity || 1
    const goal = isIn ? 0.8 : 0
    const gap = this.options.fadeInterval / ms
    if (isIn) {
      el.style.display = 'block'
      el.style.opacity = opacity
    }
    const func = () => {
      opacity = isIn ? opacity + gap : opacity - gap
      el.style.opacity = opacity
      if (opacity <= 0) {
        this._remove(el)
        this._checkRemoveContainer()
      }
      if ((!isIn && opacity <= goal) || (isIn && opacity >= goal)) {
        window.clearInterval(fading)
      }
    }
    const fading = window.setInterval(func, this.options.fadeInterval)
    return fading
  }

  _checkRemoveContainer = () => {
    const item = document.querySelector('.notify')
    if (!item) {
      let container = document.querySelector('.notify-container')
      container.outerHTML = ''
      container = null
    }
  }
}

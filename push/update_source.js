const EventEmitter = require('events')
const _ = require('lodash')
const util = require('util')
const setTimeoutPromise = util.promisify(setTimeout)

const widgetSource = require('./widget_source')

class WidgetUpdater extends EventEmitter {
  async emitWidget (w) {
    if (!w) {
      w = await widgetSource.generateWidget()
    }
    this.emit('widget_updated', w)
  }

  async loop () {
    while (this.do) {
      await setTimeoutPromise(_.random(250, 2000))
      this.emitWidget()
    }
  }

  start () {
    this.do = true
    this.loop()
  }

  stop () {
    this.do = false
  }
}

module.exports = {
  WidgetUpdater
}

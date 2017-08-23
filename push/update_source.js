/*
 * This mock some kind of widget update mechanism which notifies the main widget
 * service of updated widgets. For example something like AMQP or some other
 * messanging system.
 */

const EventEmitter = require('events')
const _ = require('lodash')
const util = require('util')
const setTimeoutPromise = util.promisify(setTimeout)

const { getWidget } = require('./widget_source')

class WidgetUpdater extends EventEmitter {
  async emitWidget (w) {
    if (!w) {
      w = await getWidget()
    }
    this.emit('widget_updated', w)
  }

  async loop () {
    while (this.do) {
      await setTimeoutPromise(_.random(1000, 10000))
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

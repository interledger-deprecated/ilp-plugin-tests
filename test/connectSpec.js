'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const opts = testPlugin.options[0].pluginOptions
let plugin = null

const handle = (err) => console.error(err)

describe('Plugin setup', function () {
  describe('constructor', function () {
    it('should succeed with valid configuration', function () {
      plugin = new Plugin(opts)
      assert.isObject(plugin)
    })

    it('should throw when options are missing', function () {
      assert.throws(() => {
        return new Plugin()
      })
    })
  })

  describe('canConnectToLedger', function () {
    it('should be a function', function () {
      assert.isFunction(Plugin.canConnectToLedger) 
    })
  
    it('should always return boolean', function () {
      assert.isBoolean(Plugin.canConnectToLedger({}))
    })
  
    it('should return true on valid credentials', function () {
      assert.isTrue(Plugin.canConnectToLedger(opts))
    })
  })

  describe('connect', function () {
    it('should be a function', function () {
      assert.isFunction(plugin.connect)
    })

    let p = null
    it('connects and emits "connect"', function (done) {
      plugin.once('connect', () => {
        done()
      })
      p = plugin.connect().catch(handle)
    })

    it('should return "true" from isConnected after connect', function () {
      assert.isTrue(plugin.isConnected())
    })
  
    it('should resolve to null', function (done) {
      p.then((result) => {
        assert.isNull(result)
        done()
      })
    })

    it('ignores if called twice', function * () {
      yield plugin.connect()
      assert.isTrue(plugin.isConnected())
    })
  })

  describe('disconnect', function () {
    it('should be a function', function () {
      assert.isFunction(plugin.disconnect)
    })

    let p = null
    it('disconnects and emits "disconnect"', function (done) {
      plugin.once('disconnect', () => {
        done()
      })
      p = plugin.disconnect()
    })

    it('should resolve to null', function (done) {
      p.then((result) => {
        assert.isNull(result)
        done()
      })
    })

    it('should return "false" from isConnected after disconnect', function () {
      assert.isFalse(plugin.isConnected())
    })

    it('should reconnect', function * () {
      yield plugin.connect()
      assert.isTrue(plugin.isConnected())
    })

    it('should disconnect again', function (done) {
      plugin.once('disconnect', () => {
        done()
      })
      plugin.disconnect()
    })
  })
})

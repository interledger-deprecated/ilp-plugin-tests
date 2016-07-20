'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const opts = testPlugin.opts
let plugin = null

describe('Plugin object', function () {

  describe('constructor', function () {
    it('should succeed with valid configuration', function () {
      plugin = new Plugin(opts)
      assert.instanceOf(plugin, Plugin)
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
  })

  describe('connect', function () {
    it('connects', function * () {
      yield plugin.connect()
      assert.isTrue(plugin.isConnected())
    })

    it('ignores if called twice', function * () {
      yield plugin.connect()
      assert.isTrue(plugin.isConnected())
    })

    it('disconnects', function * () {
      yield plugin.disconnect()
      assert.isFalse(plugin.isConnected()) 
    })

    it('should reconnect', function * () {
      yield plugin.connect()
      assert.isTrue(plugin.isConnected())
    })
  })

})

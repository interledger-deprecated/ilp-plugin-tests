'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const opts = testPlugin.options[0].pluginOptions
const timeout = testPlugin.timeout

describe('Plugin info', function () {
  beforeEach(function * () {
    // give plenty of time more than the expiry
    this.timeout += timeout * 2

    this.plugin = new Plugin(opts)
    assert.isObject(this.plugin)

    const p = new Promise(resolve => this.plugin.once('connect', resolve))
    yield this.plugin.connect({ timeout })
    yield p
    assert.isTrue(this.plugin.isConnected())
  })

  afterEach(function * () {
    if (this.plugin.isConnected()) yield this.plugin.disconnect()
  })

  describe('getInfo', function () {
    it('should be a function', function () {
      assert.isFunction(this.plugin.getInfo)
    })

    it('should return a promise to object with correct fields', function () {
      const p = this.plugin.getInfo()
      assert.isObject(p)
      assert.isNumber(p.currencyScale, 'should contain "scale"')
      assert.isArray(p.connectors)
      assert.match(p.prefix, /^[a-zA-Z0-9._~-]+\.$/,
        'should match ilp address pattern and end in "."')
      p.connectors.forEach((connector) => {
        assert.isString(connector)
      })
    })
  })

  describe('getBalance', function () {
    it('should be a function', function () {
      assert.isFunction(this.plugin.getBalance)
    })

    it('should return a promise to number stored as a string', function * () {
      const p = yield this.plugin.getBalance()
      assert.isString(p)
      assert.isFalse(isNaN(p - 0), 'should be a number in string form')
    })
  })
})

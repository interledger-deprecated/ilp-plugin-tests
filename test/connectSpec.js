'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const opts = testPlugin.options[0].pluginOptions
const timeout = testPlugin.timeout

describe('Plugin setup', function () {
  beforeEach(function () {
    // give plenty of time more than the expiry
    this.timeout += timeout * 2

    this.plugin = new Plugin(opts)
    assert.isObject(this.plugin)
  })

  afterEach(function * () {
    if (this.plugin.isConnected()) yield this.plugin.disconnect()
  })

  describe('constructor', function () {
    it('should succeed with valid configuration', function () {
      this.plugin = new Plugin(opts)
      assert.isObject(this.plugin)
    })

    it('should throw when options are missing', function () {
      assert.throws(() => {
        return new Plugin()
      })
    })
  })

  describe('connect', function () {
    it('should be a function', function () {
      assert.isFunction(this.plugin.connect)
    })

    it('should resolve to null', function (done) {
      this.plugin.connect({ timeout })
        .then((result) => {
          assert.isNotOk(result)
          done()
        })
        .catch(done)
    })

    it('ignores if called twice', function * () {
      yield this.plugin.connect({ timeout })
      yield this.plugin.connect({ timeout })
      assert.isTrue(this.plugin.isConnected())
    })
  })

  describe('disconnect', function () {
    it('should be a function', function () {
      assert.isFunction(this.plugin.disconnect)
    })

    it('disconnects and emits "disconnect"', function (done) {
      this.plugin.once('disconnect', () => {
        done()
      })

      this.plugin.once('connect', () => {
        this.plugin.disconnect()
          .then((result) => {
            assert.isNotOk(result, 'disconnect should return a promise to null')
          })
          .catch(done)
      })

      this.plugin.connect({ timeout })
    })

    it('should resolve to null', function (done) {
      this.plugin.once('connect', () => {
        this.plugin.disconnect()
          .then((result) => {
            assert.isNotOk(result)
            done()
          })
          .catch(done)
      })

      this.plugin.connect({ timeout })
    })

    it('returns "false" from isConnected after disconnect', function (done) {
      this.plugin.once('connect', () => {
        this.plugin.once('disconnect', () => {
          assert.isFalse(this.plugin.isConnected())
          done()
        })
        this.plugin.disconnect().catch(done)
      })
      this.plugin.connect({ timeout })
    })
  })
})

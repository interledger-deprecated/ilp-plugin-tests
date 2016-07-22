'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const opts = testPlugin.options[0].pluginOptions
const timeout = testPlugin.timeout

const handle = (err) => console.error(err)

describe('Plugin setup', function () {
  beforeEach(function () {
    this.plugin = new Plugin(opts)
    assert.isObject(this.plugin)

    this.timeout += timeout
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

    it('connects and emits "connect"', function (done) {
      this.plugin.once('connect', () => {
        done()
      })
      this.plugin.connect()
        .then((result) => {
          assert.isNull(result, 'connect should return a promise to null')
        })
        .catch(handle)
    })

    it('returns "true" from isConnected after connect', function (done) {
      this.plugin.once('connect', () => {
        assert.isTrue(this.plugin.isConnected())
        done()
      })
      this.plugin.connect().catch(handle)
    })
  
    it('should resolve to null', function (done) {
      this.plugin.connect()
        .then((result) => {
          assert.isNull(result)
          done()
        })
    })

    it('ignores if called twice', function (done) {
      this.plugin.once('connect', () => {
        assert.isTrue(this.plugin.isConnected())
        done()
      })
      
      this.plugin.connect()
      this.plugin.connect()
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
            assert.isNull(result, 'disconnect should return a promise to null')
          })
          .catch(handle)
      })

      this.plugin.connect()
    })

    it('should resolve to null', function (done) {
      this.plugin.once('connect', () => {
        this.plugin.disconnect()
          .then((result) => {
            assert.isNull(result)
            done()
          })
      })

      this.plugin.connect()
    })

    it('returns "false" from isConnected after disconnect', function (done) {
      this.plugin.once('connect', () => {
        this.plugin.once('disconnect', () => {
          assert.isFalse(this.plugin.isConnected())
          done()
        })
        this.plugin.disconnect()
      })
      this.plugin.connect()
    })

    it('should reconnect', function (done) {
      this.plugin.once('connect', () => {
        this.plugin.once('disconnect', () => {
          this.plugin.once('connect', () => {
            assert.isTrue(this.plugin.isConnected())
            done()
          })
          this.plugin.connect()
        })
        this.plugin.disconnect()
      })
      this.plugin.connect()
    })
  })
})

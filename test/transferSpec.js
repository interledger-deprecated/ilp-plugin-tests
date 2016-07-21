'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const uuid = require('uuid4')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const transferB = testPlugin.options[1].transfer
let pluginA = null
let pluginB = null

const handle = (err) => console.error(err)

describe('Plugin transfers', function () {
  it('should create two plugins', function () {
    pluginA = new Plugin(optsA)
    pluginB = new Plugin(optsB)

    assert.isObject(pluginA)
    assert.isObject(pluginB)
  })

  it('should connect two plugins', function * () {
    yield pluginA.connect()
    yield pluginB.connect()

    assert.isTrue(pluginA.isConnected())
    assert.isTrue(pluginB.isConnected())
  })

  describe('send', function () {
    it('should send an optimistic transfer with 0 amount', function (done) {
      let date = new Date()
      date.setSeconds(date.getSeconds() + 2)
      let id = uuid()
      pluginA.send(Object.assign({
        id: id,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: date.toISOString(),
      }, transferA)).catch(handle)
      pluginB.once('receive', (transfer) => {
        assert.equals(tranfer.id, id)
        done()
      })
    })

    it('should send an optimistic transfer with 1 amount', function (done) {
      let date = new Date()
      date.setSeconds(date.getSeconds() + 2)
      let id = uuid()
      assert.isTrue(pluginA.isConnected())
      pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: date.toISOString(),
      }, transferA)).catch(handle)
      pluginB.once('receive', (transfer) => {
        assert.equals(tranfer.id, id)
        done()
      })
    })
  })
})

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
      const id = uuid()

      pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, id)
        done()
      })

      pluginA.send(Object.assign({
        id: id,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    let myId = null
    it('should send an optimistic transfer with amount 1', function (done) {
      myId = uuid()

      pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, myId)
        done()
      })

      pluginA.send(Object.assign({
        id: myId,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })
    
    it('should reject optimistic transfer with repeat id', function (done) {
      pluginA.once('reject', (transfer, reason) => {
        assert.equal(transfer.id, myId)
        done()
      })
      pluginB.once('receive', (transfer) => { console.log('uh oh') })

      pluginA.send(Object.assign({
        id: myId,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    it('should reject optimistic transfer with amount -1', function (done) {
      pluginA.once('reject', (transfer, reason) => {
        assert.equal(transfer.id, myId)
        done()
      })

      pluginA.send(Object.assign({
        id: myId,
        amount: '-1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })
  })
})

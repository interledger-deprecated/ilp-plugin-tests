'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const uuid = require('uuid4')
const cc = require('five-bells-condition')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const transferB = testPlugin.options[1].transfer
let pluginA = null
let pluginB = null

const handle = (err) => console.error(err)
const makeExpiry = () => (new Date((new Date).getTime() + 10000)).toISOString()

describe('Plugin transfers (universal)', function () {
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
    const condition = 'cc:0:3:47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU:0'
    const fulfillment = 'cf:0:'

    let myId = null
    it('should send a transfer with a condition and expiry', function (done) {
      myId = uuid()

      pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, myId)
        done()
      })

      pluginA.send(Object.assign({
        id: myId,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: condition,
        expiresAt: makeExpiry()
      }, transferA))
    })

    it('should fulfill a condition given a fulfillment', function (done) {
      pluginA.once('fulfill_execution_condition', (transfer) => {
        assert.equal(transfer.id, myId)
        done()
      })

      pluginB.fulfillCondition(myId, fulfillment)
    })
  })
})

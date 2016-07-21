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

const handle = (err) => console.error(err)
const makeExpiry = (t) => {
  return (new Date((new Date()).getTime() + t * 1000)).toISOString()
}

describe('Plugin transfers (universal)', function () {
  
  beforeEach(function * () {
    this.pluginA = new Plugin(optsA)
    this.pluginB = new Plugin(optsB)
      
    yield this.pluginA.connect()
    yield this.pluginB.connect()

    assert.isTrue(this.pluginA.isConnected())
    assert.isTrue(this.pluginB.isConnected())
  })

  describe('send', function () {
    const condition = 'cc:0:3:47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU:0'
    const fulfillment = 'cf:0:'

    it('should fulfill transfer with condition and expiry', function (done) {
      const id = uuid()

      this.pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, id)

        this.pluginA.once('fulfill_execution_condition', (transfer) => {
          assert.equal(transfer.id, id)
          done()
        })

        this.pluginB.fulfillCondition(id, fulfillment)
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: condition,
        expiresAt: makeExpiry(10)
      }, transferA))
    })

    it('should time out a transfer', function (done) {
      const id = uuid()

      this.pluginA.once('reject', (transfer) => {
        assert.equal(transfer.id, id)
        done()
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: condition,
        expiresAt: makeExpiry(0)
      }, transferA))
    })
  })
})

'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const uuid = require('uuid4')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const transferB = testPlugin.options[1].transfer

const handle = (err) => console.error(err)

describe('Plugin transfers (optimistic)', function () {

  beforeEach(function * () {
    this.pluginA = new Plugin(optsA)
    this.pluginB = new Plugin(optsB)
      
    yield this.pluginA.connect()
    yield this.pluginB.connect()

    assert.isTrue(this.pluginA.isConnected())
    assert.isTrue(this.pluginB.isConnected())
  })

  describe('send', function () {
    it('should send an optimistic transfer with 0 amount', function (done) {
      const id = uuid()

      this.pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, id)
        done()
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '0.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    it('should send an optimistic transfer with amount 1', function (done) {
      const id = uuid()

      this.pluginB.once('receive', (transfer) => {
        assert.equal(transfer.id, id)
        done()
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })
    
    it('should reject optimistic transfer with repeat id', function (done) {
      const id = uuid()

      this.pluginA.once('receive', (transfer, reason) => {
        assert.equal(transfer.id, id)

        this.pluginA.once('reject', (transfer, reason) => {
          assert.equal(transfer.id, id)
          done()
        })

        this.pluginA.send(Object.assign({
          id: id,
          amount: '1.0',
          data: new Buffer(''),
          noteToSelf: new Buffer(''),
          executionCondition: undefined,
          cancellationCondition: undefined,
          expiresAt: undefined
        }, transferA)).catch(handle)
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    it('should reject optimistic transfer with amount -1', function (done) {
      const id = uuid()

      this.pluginA.once('reject', (transfer, reason) => {
        assert.equal(transfer.id, id)
        done()
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '-1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    it('should reject a transfer missing `account`', function (done) {
      const id = uuid()

      this.pluginA.once('reject', (transfer, reason) => {
        assert.equal(transfer.id, id)
        done()
      })

      let transfer = Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)
      transfer.account = undefined

      this.pluginA.send(transfer).catch(handle)
    })

    it('should reject a transfer missing `amount`', function (done) {
      const id = uuid()

      this.pluginA.once('reject', (transfer, reason) => {
        assert.equal(transfer.id, id)
        done()
      })

      let transfer = Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)
      transfer.amount = undefined

      this.pluginA.send(transfer).catch(handle)
    })
  })

  describe('replyToTransfer', function (done) {
    it('should reply to a successful transfer', function (done) {
      const id = uuid()

      this.pluginB.once('receive', (transfer) => {
        this.pluginA.once('reply', (transfer, message) => {
          assert.equal(transfer.id, id)
          done()
        })
        
        assert.equal(transfer.id, id)
        this.pluginB.replyToTransfer(transfer.id, new Buffer('hello'))
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(handle)
    })

    it('should reply to a failed transfer', function (done) {
      const id = uuid()

      this.pluginA.once('reject', (transfer) => {
        this.pluginA.once('reply', (transfer, message) => {
          assert.equal(transfer.id, id)
          done()
        })
        
        assert.equal(transfer.id, id)
        this.pluginB.replyToTransfer(transfer.id, new Buffer('hello'))
      })

      this.pluginA.send(Object.assign({
        id: id,
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

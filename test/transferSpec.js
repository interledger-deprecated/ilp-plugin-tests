'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const uuid = require('uuid4')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const timeout = testPlugin.timeout

describe('Plugin transfers (optimistic)', function () {
  beforeEach(function * () {
    this.pluginA = new Plugin(optsA)
    this.pluginB = new Plugin(optsB)

    const pA = new Promise(resolve => this.pluginA.once('connect', resolve))
    this.pluginA.connect()
    yield pA

    const pB = new Promise(resolve => this.pluginB.once('connect', resolve))
    this.pluginB.connect()
    yield pB

    assert.isTrue(this.pluginA.isConnected())
    assert.isTrue(this.pluginB.isConnected())

    this.timeout += timeout
  })

  afterEach(function * () {
    if (this.pluginA.isConnected()) yield this.pluginA.disconnect()
    if (this.pluginB.isConnected()) yield this.pluginB.disconnect()
  })

  describe('send', function () {
    it('should be a function', function () {
      assert.isFunction(this.pluginA.send)
    })

    it('should send an optimistic transfer with 0 amount', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
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
      }, transferA))
        .then((result) => {
          assert.isNull(result, 'send should resolve to null')
        })
        .catch(done)
    })

    it('should send an optimistic transfer with amount 1', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
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
      }, transferA)).catch(done)
    })

    it('should emit a transfer with correct fields with `outgoing_transfer`', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_transfer', (transfer) => {
        console.log(transfer)
        assert.equal(transfer.id, id)
        assert.isOk(transfer.amount)
        assert.isOk(transfer.account)
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
      }, transferA)).catch(done)
    })

    it('should emit a transfer with correct fields with `incoming_transfer`', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        console.log(transfer)
        assert.equal(transfer.id, id)
        assert.isOk(transfer.amount)
        assert.isOk(transfer.account)
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
      }, transferA)).catch(done)
    })

    it('should reject optimistic transfer with repeat id', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer, reason) => {
        assert.equal(transfer.id, id)

        this.pluginA.send(Object.assign({
          id: id,
          amount: '1.0',
          data: new Buffer(''),
          noteToSelf: new Buffer(''),
          executionCondition: undefined,
          cancellationCondition: undefined,
          expiresAt: undefined
        }, transferA)).catch(() => {
          done()
        })
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(done)
    })

    it('should reject transfer with repeat id (from receiver)', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer, reason) => {
        assert.equal(transfer.id, id)

        this.pluginB.send(Object.assign({
          id: id,
          amount: '1.0',
          data: new Buffer(''),
          noteToSelf: new Buffer(''),
          executionCondition: undefined,
          cancellationCondition: undefined,
          expiresAt: undefined
        }, transferA)).catch((e) => {
          assert.equal(e.name, 'RepeatError')
          done()
        })
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(done)
    })

    it('should reject optimistic transfer with amount -1', function (done) {
      const id = uuid()

      this.pluginA.send(Object.assign({
        id: id,
        amount: '-1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject a transfer missing `account`', function (done) {
      const id = uuid()

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA, {
        account: undefined
      })).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject a transfer missing `amount`', function (done) {
      const id = uuid()

      this.pluginA.send(Object.assign({
        id: id,
        amount: undefined,
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })
  })

  describe('replyToTransfer', function (done) {
    it('should be a function', function () {
      assert.isFunction(this.pluginA.replyToTransfer)
    })

    it('should reply to a successful transfer', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        this.pluginA.once('reply', (transfer, message) => {
          assert.equal(transfer.id, id)
          done()
        })

        assert.equal(transfer.id, id)
        this.pluginB.replyToTransfer(transfer.id, new Buffer('hello'))
          .then((result) => {
            assert.isNull(result, 'replyToTransfer should resolve to null')
          })
      })

      this.pluginA.send(Object.assign({
        id: id,
        amount: '1.0',
        data: new Buffer(''),
        noteToSelf: new Buffer(''),
        executionCondition: undefined,
        cancellationCondition: undefined,
        expiresAt: undefined
      }, transferA)).catch(done)
    })

    it('should not reply to a successful transfer', function (done) {
      this.pluginB.replyToTransfer(uuid(), new Buffer('hello'))
        .catch((e) => {
          assert.equal(e.name, 'TransferNotFoundError')
          done()
        }).catch(done)
    })
  })
})

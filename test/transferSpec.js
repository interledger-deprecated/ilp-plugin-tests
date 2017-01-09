'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const uuid = require('uuid4')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const transferB = testPlugin.options[1].transfer
const timeout = testPlugin.timeout

describe('Plugin transfers (optimistic)', function () {
  beforeEach(function * () {
    // give plenty of time more than the expiry
    this.timeout += timeout * 2

    this.pluginA = new Plugin(optsA)
    this.pluginB = new Plugin(optsB)

    const pA = new Promise(resolve => this.pluginA.once('connect', resolve))
    yield this.pluginA.connect()
    yield pA

    const pB = new Promise(resolve => this.pluginB.once('connect', resolve))
    yield this.pluginB.connect()
    yield pB

    assert.isTrue(this.pluginA.isConnected())
    assert.isTrue(this.pluginB.isConnected())
  })

  afterEach(function * () {
    if (this.pluginA.isConnected()) yield this.pluginA.disconnect()
    if (this.pluginB.isConnected()) yield this.pluginB.disconnect()
  })

  describe('sendTransfer', function () {
    it('should be a function', function () {
      assert.isFunction(this.pluginA.sendTransfer)
    })

    it('should send an optimistic transfer with amount 1', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        // The account field refers to the local source account that the transfer originated from.
        // (see https://github.com/interledger/rfcs/blob/master/0004-ledger-plugin-interface/0004-ledger-plugin-interface.md#incomingtransfer)
        assert.equal(transfer.account, transferB.account)
        done()
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA)).catch(done)
    })

    it('should emit a transfer with correct fields with `outgoing_transfer`', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferA.account)
        done()
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA)).catch(done)
    })

    it('should emit a transfer with correct fields with `incoming_transfer`', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)
        done()
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA)).catch(done)
    })

    it('should neither throw error nor send twice on optimistic transfer with repeat id', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer, reason) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)

        this.pluginA.sendTransfer(Object.assign({
          id: id,
          amount: '1.0'
        }, transferA))
          .then(() => {
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA)).catch(done)
    })

    it('should reject transfer with repeat id which does not match original', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer, reason) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)

        this.pluginB.sendTransfer(Object.assign({
          id: id,
          amount: '1.1'
        }, transferA))
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'DuplicateIdError')
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA)).catch(done)
    })

    it('should reject optimistic transfer with amount 0', function (done) {
      const id = uuid()

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '0'
      }, transferA)).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject optimistic transfer with amount -1', function (done) {
      const id = uuid()

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '-1.0'
      }, transferA)).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject a transfer missing `account`', function (done) {
      const id = uuid()

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1.0'
      }, transferA, {
        account: undefined
      })).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject a transfer missing `id`', function (done) {
      this.pluginA.sendTransfer(Object.assign({
        amount: '1.0'
      }, transferA, {
        account: undefined
      })).catch((e) => {
        assert.equal(e.name, 'InvalidFieldsError')
        done()
      }).catch(done)
    })

    it('should reject a transfer missing `amount`', function (done) {
      const id = uuid()

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: undefined
      }, transferA))
        .catch((e) => {
          assert.equal(e.name, 'InvalidFieldsError')
          done()
        }).catch(done)
    })

    it('should reject a transfer with a malformed `amount`', function (done) {
      const id = uuid()

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: 'garbage'
      }, transferA))
        .catch((e) => {
          assert.equal(e.name, 'InvalidFieldsError')
          done()
        }).catch(done)
    })
  })
})

'use strict'

const assert = require('chai').assert
const testPlugin = require('..')
const sinon = require('sinon')
const uuid = require('uuid4')

const Plugin = testPlugin.plugin

const optsA = testPlugin.options[0].pluginOptions
const optsB = testPlugin.options[1].pluginOptions
const transferA = testPlugin.options[0].transfer
const transferB = testPlugin.options[1].transfer
const timeout = testPlugin.timeout
const rejectionMessage = {
  code: 'S01',
  name: 'Sender Error',
  message: 'There was an error',
  triggered_by: 'example.alice',
  triggered_at: '2017-05-03T15:14:52.813Z',
  additional_info: {}
}

const makeExpiry = (t) => {
  return (new Date((new Date()).getTime() + t)).toISOString()
}
 
describe('Plugin transfers (universal)', function () {
  beforeEach(function * () {
    // give plenty of time more than the expiry
    this.timeout += timeout * 2

    this.pluginA = new Plugin(optsA)
    this.pluginB = new Plugin(optsB)

    const pA = new Promise(resolve => this.pluginA.once('connect', resolve))
    yield this.pluginA.connect({ timeout })
    yield pA

    const pB = new Promise(resolve => this.pluginB.once('connect', resolve))
    yield this.pluginB.connect({ timeout })
    yield pB

    assert.isTrue(this.pluginA.isConnected())
    assert.isTrue(this.pluginB.isConnected())

    this.prefix = this.pluginA.getInfo().prefix
  })

  afterEach(function * () {
    if (this.pluginA.isConnected()) yield this.pluginA.disconnect()
    if (this.pluginB.isConnected()) yield this.pluginB.disconnect()
  })

  describe('fulfillCondition', function () {
    const condition = 'uzoYx3K6u-Nt6kZjbN6KmH0yARfhkj9e17eQfpSeB7U'
    const fulfillment = 'HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok'

    it('should be a function', function () {
      assert.isFunction(this.pluginA.fulfillCondition)
    })

    it('should fulfill transfer with condition and expiry', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_fulfill', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)
        done()
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.fulfillCondition(id, fulfillment)
          .then((result) => {
            assert.isNotOk(result, 'fulfillCondition should resolve to null')
          })
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))
    })

    it('should notify the receiver of a fulfillment', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_fulfill', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)
        done()
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.fulfillCondition(id, fulfillment)
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))
    })

    it('should time out a transfer', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_cancel', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)
        done()
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))
    })

    it('should not fulfill an optimistic transfer', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)

        this.pluginB.fulfillCondition(id, fulfillment)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'TransferNotConditionalError')
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1'
      }, transferA)).catch(done)
    })

    it('should not fulfill with invalid fulfillment', function * () {
      const id = uuid()

      const fulfillStub = sinon.stub()
      this.pluginA.on('outgoing_fulfill', fulfillStub)

      const promise = new Promise(resolve =>
        this.pluginA.once('outgoing_cancel', resolve)
      )

      yield this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))

      yield this.pluginB.fulfillCondition(id, 'garbage')
        .catch((e) => {
          assert.equal(e.name, 'InvalidFieldsError')
        })

      const transfer = yield promise
      assert.equal(transfer.id, id)

      sinon.assert.notCalled(fulfillStub)
    })

    it('should not fulfill with incorrect fulfillment', function * () {
      const id = uuid()

      const fulfillStub = sinon.stub()
      this.pluginA.on('outgoing_fulfill', fulfillStub)

      const promise = new Promise(resolve =>
        this.pluginA.once('outgoing_cancel', resolve)
      )

      yield this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))

      yield this.pluginB.fulfillCondition(id, 'wrongfulfillmentwrongfulfillmentwrongfulfil')
        .catch((e) => {
          assert.equal(e.name, 'NotAcceptedError')
        })

      const transfer = yield promise
      assert.equal(transfer.id, id)

      sinon.assert.notCalled(fulfillStub)
    })

    it('should fulfill a transfer twice without error', function * () {
      const id = uuid()

      const fulfillStub = sinon.stub()
      this.pluginA.on('outgoing_fulfill', fulfillStub)

      yield this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))

      yield this.pluginB.fulfillCondition(id, fulfillment)
      yield this.pluginB.fulfillCondition(id, fulfillment)

      sinon.assert.calledTwice(fulfillStub)
    })

    it('should fulfill a transfer after being unsuccessful', function * () {
      const id = uuid()

      const promise = new Promise(resolve =>
        this.pluginA.once('outgoing_fulfill', resolve))

      yield this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))

      yield this.pluginB.fulfillCondition(id, 'garbage')
        .catch((e) => {
          assert.equal(e.name, 'InvalidFieldsError')
        })

      yield this.pluginB.fulfillCondition(id, fulfillment)
      yield promise
    })

    it('should not fulfill a transfer with a non-matching id', function * () {
      const id = uuid()
      const fakeId = uuid()

      const fulfillStub = sinon.stub()
      this.pluginA.on('outgoing_fulfill', fulfillStub)

      const promise = new Promise(resolve =>
        this.pluginA.once('outgoing_cancel', resolve)
      )

      yield this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))

      yield this.pluginB.fulfillCondition(fakeId, fulfillment)
        .catch((e) => {
          assert.equal(e.name, 'TransferNotFoundError')
        })

      yield promise

      sinon.assert.notCalled(fulfillStub)
    })

    it('should not fulfill a transfer after it is rejected', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_reject', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.fulfillCondition(id, fulfillment)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'AlreadyRolledBackError')
            done()
          })
          .catch(done)
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })
  })

  describe('getFulfillment', () => {
    const condition = 'uzoYx3K6u-Nt6kZjbN6KmH0yARfhkj9e17eQfpSeB7U'
    const fulfillment = 'HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok'

    it('should get the fulfillment of a completed transfer', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_fulfill', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginA.getFulfillment(transfer.id)
          .then((f) => {
            assert.equal(f, fulfillment)
            done()
          }).catch(done)
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.fulfillCondition(id, fulfillment)
          .then((result) => {
            assert.isNotOk(result, 'fulfillCondition should resolve to null')
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA))
    })

    it('should not get fulfillment of an optimistic transfer', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)

        this.pluginA.getFulfillment(id)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'TransferNotConditionalError')
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1'
      }, transferA)).catch(done)
    })

    it('should not get fulfillment after transfer is rejected', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_reject', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginA.getFulfillment(id)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'AlreadyRolledBackError')
            done()
          })
          .catch(done)
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })

    it('should reject for a nonexistant transfer', function (done) {
      const id = uuid()

      this.pluginA.getFulfillment(id)
        .catch((e) => {
          assert.equal(e.name, 'TransferNotFoundError')
          done()
        })
        .catch(done)
    })

    it('should reject for an incomplete transfer', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginA.getFulfillment(id)
          .catch((e) => {
            assert.equal(e.name, 'MissingFulfillmentError')
            done()
          }).catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })
  })

  describe('rejectIncomingTransfer', () => {
    const condition = 'uzoYx3K6u-Nt6kZjbN6KmH0yARfhkj9e17eQfpSeB7U'
    const fulfillment = 'HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok'

    it('should be a function', function () {
      assert.isFunction(this.pluginA.rejectIncomingTransfer)
    })

    it('should reject a transfer with a condition', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_reject', (transfer, reason) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)
        assert.deepEqual(reason, rejectionMessage)
        done()
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })

    it('should reject a transfer twice without error', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_reject', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)
        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
          .then(() => {
            done()
          })
          .catch(done)
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })

    it('should not reject an optimistic transfer', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_transfer', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.amount - 0, 1.0)
        assert.equal(transfer.account, transferB.account)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'TransferNotConditionalError')
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1'
      }, transferA)).catch(done)
    })

    it('should not reject transfer with condition as sender', function (done) {
      const id = uuid()

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginA.rejectIncomingTransfer(id, rejectionMessage)
          .catch((e) => {
            assert.equal(e.name, 'NotAcceptedError')
            done()
          })
          .catch(done)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })

    it('should not reject a transfer after it is fulfilled', function (done) {
      const id = uuid()

      this.pluginA.once('outgoing_fulfill', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.rejectIncomingTransfer(id, rejectionMessage)
          .then(() => {
            assert(false)
          })
          .catch((e) => {
            assert.equal(e.name, 'AlreadyFulfilledError')
            done()
          })
          .catch(done)
      })

      this.pluginB.once('incoming_prepare', (transfer) => {
        assert.equal(transfer.id, id)
        assert.equal(transfer.ledger, this.prefix)

        this.pluginB.fulfillCondition(id, fulfillment)
      })

      this.pluginA.sendTransfer(Object.assign({
        id: id,
        amount: '1',
        executionCondition: condition,
        expiresAt: makeExpiry(timeout)
      }, transferA)).catch(done)
    })

    it('should not reject nonexistant transfer', function (done) {
      this.pluginA.rejectIncomingTransfer(uuid(), rejectionMessage)
        .catch((e) => {
          assert.equal(e.name, 'TransferNotFoundError')
          done()
        })
        .catch(done)
    })
  })
})

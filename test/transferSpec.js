'use strict'

const assert = require('chai').assert
const testPlugin = require('..')

const Plugin = testPlugin.plugin
const optsA = testPlugin.opts[0]
const optsB = testPlugin.opts[1]
let pluginA = null
let pluginB = null

describe('Plugin transfers', function () {
  it('should create two plugins', function () {
    pluginA = Plugin(optsA)
    pluginB = Plugin(optsB)

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
    it('should send an optimistic transfer with 0 balance', function () {
      pluginA.send({
        id: 'uuid-or-something',
        account: optsB.account, // TODO: change this so account doesn't have
                                // to be a field
        amount: '0.0',
        data: null,
        noteToSelf: null,
        executionCondition: null,
        cancellationCondition: null,
        expiresAt: null,
        custom: null
      })
      pluginB.once('receive', (transfer) => {
        assert.equals(tranfer.id, 'uuid-or-something')
        done()
      })
    })
  })
})

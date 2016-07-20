'use strict'

const assert = require('chai').assert
const plugin = require('..')

describe('Plugin module', function () {
  it('should be a constructor', function () {
    assert.isFunction(plugin)
  })
})

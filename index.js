'use strict'

const config = require(process.env.ILP_PLUGIN_TEST_CONFIG)
const plugin = config.plugin
const options = config.options
const timeout = config.timeout

if (!plugin || !options || !timeout) {
  throw new Error('FATAL: required options are unset')
}

module.exports = { plugin, options, timeout }

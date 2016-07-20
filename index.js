'use strict'

const plugin = require(process.env.ILP_PLUGIN_TEST)
const opts = JSON.parse(process.env.ILP_PLUGIN_OPTS)

if (!plugin || !opts) {
  throw new Error('FATAL: ILP_PLUGIN_TEST and ILP_PLUGIN_OPTS must both be environment variables')
}

module.exports = { plugin, opts }

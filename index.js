'use strict'

const plugin = require(process.env.ILP_PLUGIN_TEST)
const opts = JSON.parse(process.env.ILP_PLUGIN_OPTS)
const accounts = JSON.parse(process.env.ILP_PLUGIN_TRANSFER_OPTS)

if (!plugin || !opts || !accounts) {
  throw new Error('FATAL: required environment variables are unset')
}

module.exports = { plugin, opts, accounts }

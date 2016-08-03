// This field contains the constructor for a plugin
exports.plugin = require('ilp-plugin-virtual')

// This specifies the number of time in seconds that the plugin needs in order
// to fulfill a transfer (from send until fulfillment goes through).
exports.timeout = 1

let store = {}
let s = store.s = {}
store.get = (k) => { return Promise.resolve(s[k]) }
store.put = (k, v) => { s[k] = v; return Promise.resolve(null) }
store.del = (k) => { s[k] = undefined; return Promise.resolve(null) }

const crypto = require('crypto')
const token = crypto.randomBytes(32).toString('hex')

const mock =
  require('../node_modules/ilp-plugin-virtual/test/helpers/mockConnection')
const MockConnection = mock.MockConnection
const MockChannels = mock.MockChannels

// These objects specify the configs of different
// plugins. There must be 2, so that they can send
// transfers to one another.
exports.options = [
  // options for the first plugin
  {
    // These are the PluginOptions passed into the plugin's
    // constructor.
    'pluginOptions': {
      "auth": {
        "account": "nerd",
        "host": "ws://broker.hivemq.com:8000",
        "limit": "0",
        "balance": "100",
        "token": token,
        "mockConnection": MockConnection,
        "mockChannels": MockChannels,
        "secret": "not used yet"
      },
      "store": store
    },
    // These objects are merged with transfers originating from
    // their respective plugins. Should specify the other plugin's
    // account, so that the two plugins can send to one another
    'transfer': {
      'account': 'noob'
    }
  },
  // options for the second plugin
  {
    'pluginOptions': {
      'auth': {
        "account": "noob",
        "host": "ws://broker.hivemq.com:8000",
        "mockConnection": MockConnection,
        "mockChannels": MockChannels,
        "token": token
      }
    },
    'transfer': {
      'account': 'nerd'
    }
  }
]

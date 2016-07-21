// This field contains the constructor for a plugin
exports.plugin = require('ilp-plugin-virtual')

let store = {}
let s = store.s = {}
store.get = (k) => { return Promise.resolve(s[k]) }
store.put = (k, v) => { s[k] = v; return Promise.resolve(null) }
store.del = (k) => { s[k] = undefined; return Promise.resolve(null) }

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
        "token": "487810b8f3ffc76d8ab0130a6a3c9845",
        "secret": "not used yet",
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
        "token": "487810b8f3ffc76d8ab0130a6a3c9845"
      }
    },
    'transfer': {
      'account': 'nerd'
    }
  }
]

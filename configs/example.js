// This field contains the constructor for a plugin
exports.plugin = require('ilp-plugin-bells')

// These objects specify the configs of different
// plugins. There must be 2, so that they can send
// transfers to one another.
exports.options = [
  // options for the first plugin
  {
    // These are the PluginOptions passed into the plugin's
    // constructor.
    'pluginOptions': {
      'auth': {
        'asset': 'USD',
        'id': 'http://localhost:3000',
        'username': 'bob',
        'password': 'bob',
        'account': 'http://localhost:3000/accounts/bob',
        'ledger': 'http://localhost:3000',
        'type': 'bells'
      }
    },
    // These objects are merged with transfers originating from
    // their respective plugins. Should specify the other plugin's
    // account, so that the two plugins can send to one another
    'transfer': {
      'account': 'http://localhost:3000/accounts/alice'
    }
  },
  // options for the second plugin
  {
    'pluginOptions': {
      'auth': {
        'asset': 'USD',
        'id': 'http://localhost:3000',
        'username': 'alice',
        'password': 'alice',
        'account': 'http://localhost:3000/accounts/alice',
        'ledger': 'http://localhost:3000',
        'type': 'bells'
      }
    },
    'transfer': {
      'account': 'http://localhost:3000/accounts/bob'
    }
  }
]

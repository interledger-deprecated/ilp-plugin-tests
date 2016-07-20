# Ilp-Plugin Tests

> A test suite for ILP LedgerPlugins, to make sure they conform to the
> javascript LedgerPlugin interface.

## Usage

Using ILP-Plugin Test is simple; just set a couple environment variables, and
make sure the plugin you wish to test is in the `node_modules` folder. Then run
`npm test`.

For example, to test `ilp-plugin-bells`, you could run:

```sh
npm install ilp-plugin-bells

# This is the module to import. Requiring it should yield a constructor.

export ILP_PLUGIN_TEST='ilp-plugin-bells'

# These objects are passed directly into the plugin constructor. The first one
# is used for all the tests that do not require two plugins (eg. tests that
# involve transfers). These should connect the two plugins to the same ledger*,
# otherwise it's useless to instantiate both of them.
#
# *ledgers sold separately.

export ILP_PLUGIN_OPTS='[{
  "auth": {
    "username":"bob",
    ...
  },
  ...
}, {
  "auth": {
    "username":"alice",
    ...
  },
  ...
}]'

# These objects are used to create transfers. The first object contains the
# "account" and "custom" fields for transfers from plugin1 -> plugin2.
# The second contains fields for plugin2 -> plugin1.

export ILP_PLUGIN_TRANSFER_OPTS='[{
  "account": "alice",
  "custom": null
}, {
  "account": "bob",
  "custom": { ... }
}]'

npm test
```

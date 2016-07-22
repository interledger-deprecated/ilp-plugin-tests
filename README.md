# Ilp-Plugin Tests

> A test suite for ILP LedgerPlugins, to make sure they conform to the
> javascript LedgerPlugin interface.

## Usage

To use Ilp-Plugin Tests, just write a module that exports the plugin
constructor (as `.plugin`), a list of 2 options objects (as `.opts`), and a
timeout for payments to go through (as `.timeout`). This list of options should
contain options in the form:

```js
{
  // plugin options here, for constructor
  'pluginOptions': {
    'auth': {
      'account': 'bob',
      ...
    }
  },
  // options for transfers, added to transfers
  'transfer': {
    'account': 'alice',
    ... 
  }
}
```

The file [./configs/virtual.js
](https://github.com/interledger/js-ilp-plugin-tests/blob/master/configs/virtual.js)
contains an example set of options. For example, to test `ilp-plugin-virtual`, you
could run:

```sh
npm install ilp-plugin-virtual
ILP_PLUGIN_TEST_CONFIG='./configs/virtual.js' npm test
```

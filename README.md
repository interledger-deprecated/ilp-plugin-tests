# Ilp-Plugin Tests

> A test suite for ILP LedgerPlugins, to make sure they conform to the
> javascript LedgerPlugin interface.

## Usage

To use Ilp-Plugin Tests, just write a module that exports the plugin constructor
(as `.plugin`), and exports a list of 2 options (as `.opts`). This list of options
should contain options in the form:

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

The file [./configs/example.js
](https://github.com/interledger/js-ilp-plugin-tests/blob/master/configs/example.js)
contains an example set of options. For example, to test `ilp-plugin-bells`, you
could run:

```sh
npm install ilp-plugin-bells
ILP_PLUGIN_TEST_CONFIG='./configs/ilp-plugin-bells.js' npm test
```

# Ilp-Plugin Tests

> A test suite for ILP LedgerPlugins, to make sure they conform to the
> javascript LedgerPlugin interface.

## Usage

Using ILP-Plugin Test is simple; just set the environment variable
`ILP_PLUGIN_TEST` to the module name of your ledger plugin, and make sure the
plugin is also in the `node_modules` folder. Then run `npm test`.

For example, you could run:

```sh
npm install ilp-plugin-bells
export ILP_PLUGIN_TEST=ilp-plugin-bells
npm test
```

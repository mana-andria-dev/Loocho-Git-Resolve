var NOOT = require('noot')('custom-require');
var path = require('path');

module.exports = NOOT.CustomRequire.create({
  name: 'planorequire',
  makeGlobal: true,
  root: path.resolve(__dirname, '../')
});

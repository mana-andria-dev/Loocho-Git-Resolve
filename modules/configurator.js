var NOOT = require('noot')('configurator');
var path = require('path');

module.exports = NOOT.Configurator.create({
  env: process.env.NODE_ENV || 'dev',
  directory: path.join(path.resolve(__dirname, '../'), 'config')
});
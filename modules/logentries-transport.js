/**
 * Dependencies
 */
var dict = require('dict');
var logentries = require('node-logentries');
var configurator = planorequire('modules/configurator');

var transport = logentries.logger({
  token: configurator.get('app').logentriesToken
});

var levelToFunc = dict();

levelToFunc.set('announce', function(message) {
  return transport.notice(message);
});

levelToFunc.set('debug', function(message) {
  return transport.debug(message);
});

levelToFunc.set('info', function(message) {
  return transport.info(message);
});

levelToFunc.set('warn', function(message) {
  return transport.warning(message);
});

levelToFunc.set('error', function(message) {
  return transport.err(message);
});

/**
 * @exports
 */
module.exports = function(message, level) {
  if (levelToFunc.has(level)) {
    return levelToFunc.get(level)(message);
  } else {
    return transport.log('debug', message);
  }
};
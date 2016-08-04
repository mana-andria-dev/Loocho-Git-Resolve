var NOOT = require('noot')('logger');
var moment = require('moment');
var configurator = planorequire('modules/configurator');

var options = {
  level: configurator.get('app', 'logging'),

  formatMessage: function(message) {
    return moment().format('YYYY-MM-DD HH:mm:ss') + ' ' + message;
  }
};

if (configurator.get('app').logentriesToken) {
  options.transport = planorequire('modules/logentries-transport');
}

module.exports = NOOT.Logger.create(options);
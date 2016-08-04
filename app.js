/**
 * Dependencies
 */
var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');

/**
 * Internal Dependencies
 */
require('./modules/planorequire');
var configurator = planorequire('modules/configurator');
var logger = planorequire('modules/logger');
var Utils = planorequire('modules/utils');
var methodOverride = require('method-override');
var cors = require('cors');

/**
 * Variables
 */
var isInitialized = false;

/**
 * Create application
 */
var app = express();

/**
 * Configure
 */
app.set('port', process.env.PORT || configurator.get('app', 'port'));
app.use(express.json());
app.use(express.urlencoded());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(cors({ origin: true, credentials: true }));

/**
 * Static directory to store files locally instead of AWS (used in dev environment)
 */
app.use('/files', express.static(path.join(__dirname + '/files')));

/**
 * Launch
 */
async.series([

  function(cb) {
    return http.createServer(app).listen(app.get('port'), function(err) {
      if (err) return cb(err);
      logger.announce('Server listening on port', app.get('port'));
      return cb();
    });
  },

], function(err) {
  if (err) throw err;

  /**
   * Declare routes
   */
  configurator.get('app', 'routes').forEach(function(routeName) {
    logger.info('Loading route', routeName);
    return planorequire(path.join('routes', routeName))(app);
  });

  /**
   * After all middlewares
   */
  app.use(planorequire('middlewares/404'));
  app.use(planorequire('middlewares/error-handler'));
  app.use(app.router);

  /**
   * Application is ready to use
   */
  app.emit('ready');

});


/**
 * @module
 *
 * @callback callback
 */
module.exports = function(callback) {
  if (isInitialized) return callback(null, app);

  return app.on('ready', function(err) {
    if (err) return callback(err);
    isInitialized = true;
    return callback(null, app);
  });
};

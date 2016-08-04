/**
 * Dependencies
 */
var NOOT = require('noot')('errors');


module.exports = function(req, res, next) {
  return next(new NOOT.Errors.NotFound('The url you requested does not exist: ' + req.method + ' ' + req.url));
};
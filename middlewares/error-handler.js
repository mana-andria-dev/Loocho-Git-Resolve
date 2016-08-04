/**
 * Dependencies
 */
var NOOT = require('noot')('error');
var logger = planorequire('modules/logger');


/* jshint unused:false */
module.exports = function(err, req, res, next) {
  // Keep a trace
  logger.error(req.method, req.originalUrl, req.body, err);

  // Define response's properties
  var json = err instanceof NOOT.Error ?
             err.toJSON() :
             { error: true, message: err.message, code: 'InternalServerError' };

  //add info for Mongoose validation errors
  if (err.errors) {
    for (var field in err.errors) {
      if (err.errors[field] && err.errors[field].message) json.message += ' - ' + err.errors[field].message;
    }
  }


  return res.json(err.statusCode || 500, json);
};
/* jshint unused:true */

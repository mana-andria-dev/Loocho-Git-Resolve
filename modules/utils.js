/**
 * Dependencies
 */
var NOOT = require('noot')('namespace');


var Utils = NOOT.Namespace.create({

  /**
   * Build a valid uri from an object
   *
   * @param {Object} options
   * @returns {String}
   */
  buildMongoPath: function(options) {
    var auth = '';
    if (options.user) auth = [options.user, ':', options.password, '@'].join('');
    var mongoPath = ['mongodb://', auth, options.host, ':', options.port, '/', options.name].join('');
    var replica = options.replicaSet;
    if (replica) mongoPath += [',', replica.host, ':', replica.port, '/', replica.name || options.name].join('');
    return mongoPath;
  }

});


/**
 * @module
 */
module.exports = Utils;
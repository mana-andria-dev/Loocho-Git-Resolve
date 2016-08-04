var configurator = planorequire('modules/configurator');

var Config = {};

Config.all = {

};

Config.production = {
  ME: 'https://loocho-git-worker.herokuapp.com',
  LOOCHO_LOGIN: 'https://login.loocho.com'
};

Config.staging = {
  ME: 'https://loocho-git-worker.herokuapp.com',
  LOOCHO_LOGIN: 'https://login.loocho-staging.com'
};

Config.dev = {
  ME: 'http://127.0.0.1:' + configurator.get('app', 'port'),
  LOOCHO_LOGIN: 'http://127.0.0.1:2000'
};

Config['unit-test'] = {
  ME: 'http://127.0.0.1:' + configurator.get('app', 'port')
};

module.exports = Config;
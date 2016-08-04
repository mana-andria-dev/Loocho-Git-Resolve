var Config = {};

Config.all = {
  port: 2005,
  routes: [
    'clone-repos'
  ]
};

Config.production = {
  logging: 'trace',
  logentriesToken: '98556a15-2c12-4362-bff3-9c701dd130a6'
};

Config.staging = {
  logging: 'trace',
  logentriesToken: '6c020502-17de-4536-98a5-7949e2bf36b0'
};

Config.dev = {
  logging: 'trace'
};

Config['unit-test'] = {
  port: 8913,
  logging: 'off'
};

module.exports = Config;
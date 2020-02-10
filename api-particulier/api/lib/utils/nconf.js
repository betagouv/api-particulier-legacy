const nconf = require('nconf')

nconf.env().argv()
nconf.defaults(require('../../../defaults'))

module.exports = nconf

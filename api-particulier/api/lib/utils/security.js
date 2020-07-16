const crypto = require('crypto')
const nconf = require('./nconf')

module.exports.signatureMatches = (applicationId, signature) => {
  return signature === crypto
    .createHash('sha512')
    .update(applicationId + nconf.get('graviteeKey'))
    .digest('hex')
}

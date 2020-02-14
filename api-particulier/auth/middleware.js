const StandardError = require('standard-error')
const axios = require('axios')

const authenticationMiddleware = async (req, res, next) => {
  const apiKey = req.header('X-API-Key')
  if (!apiKey) {
    return next(new StandardError('Missing API Key', { code: 401 }))
  }

  let userResponse
  try {
    userResponse = await axios.get(`${process.env.AUTH_SERVER}/api/auth/authorize`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return next(new StandardError('Invalid API Key', { code: 401 }))
  }

  req.logger.debug({ event: 'authorization' }, userResponse.data.name + ' is authorized (' + userResponse.data.scopes.join(' ') + ')')
  req.consumer = {
    id: userResponse.data._id,
    name: userResponse.data.name,
    scopes: userResponse.data.scopes
  }

  return next()
}

module.exports = authenticationMiddleware

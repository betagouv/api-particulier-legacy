const StandardError = require('standard-error')

const authenticationMiddleware = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test' && req.headers['x-user-id']) {
    req.consumer = {
      id: req.headers['x-user-id'],
      name: req.headers['x-user-name'],
      scopes: req.headers['x-user-scopes']
        ? req.headers['x-user-scopes'].split(',')
        : []
    }
    return next()
  }

  if (
    req.headers['x-application-id'] &&
    req.headers['x-application-name'] &&
    req.headers['x-application-scopes']
  ) {
    const applicationId = req.headers['x-application-id']
    const applicationName = req.headers['x-application-name']
    const scopes = req.headers['x-application-scopes'].split(',')

    req.consumer = {
      id: applicationId,
      name: applicationName,
      scopes
    }
    return next()
  }

  return next(new StandardError('Request missing credentials', { code: 401 }))
}

module.exports = authenticationMiddleware

const scopeAuthorization = require('../lib/middlewares/scopeAuthorization')
const express = require('express')
const Controller = require('./impots.controller')
const authenticationMiddleware = require('../../auth/middleware')
const format = require('../lib/utils/format')

const router = express.Router()

module.exports = function (options) {
  const impotsController = new Controller(options)

  router.get('/ping', impotsController.ping, format)
  router.get(
    '/svair',
    authenticationMiddleware,
    impotsController.svair,
    impotsController.authorize,
    scopeAuthorization,
    format
  )

  return router
}

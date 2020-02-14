const express = require('express')
const Controller = require('./caf.controller')
const format = require('../lib/utils/format')
const scopeAuthorization = require('../lib/middlewares/scopeAuthorization')
const authenticationMiddleware = require('../../auth/middleware')

module.exports = function (options) {
  const router = express.Router()
  const cafController = new Controller(options)

  router.use(cafController.prepare())

  router.get('/ping', cafController.ping, format)
  router.get(
    '/famille',
    authenticationMiddleware,
    cafController.famille,
    cafController.authorize,
    scopeAuthorization,
    format
  )

  return router
}

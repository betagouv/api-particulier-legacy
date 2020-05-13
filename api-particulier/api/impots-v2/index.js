const scopeAuthorization = require('../lib/middlewares/scopeAuthorization')
const express = require('express')
const Controller = require('../impots/impots.controller')
const authenticationMiddleware = require('../../auth/middleware')
const format = require('../lib/utils/format')
const svair = require('svair-api-next')

const router = express.Router()

module.exports = function (options) {
  const impotsController = new Controller({
    ...options,
    svairLib: svair
  })

  router.get(
    '/',
    authenticationMiddleware,
    impotsController.svair,
    impotsController.authorize,
    scopeAuthorization,
    format
  )

  return router
}
